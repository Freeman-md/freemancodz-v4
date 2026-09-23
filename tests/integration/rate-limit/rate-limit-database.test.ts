import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { RateLimitRepository } from "@/modules/rate-limit/repository";
import type { RateLimitRule } from "@/modules/rate-limit/rate-limit.types";

const adminConnectionUrl = process.env.PORTFOLIO_TEST_DATABASE_URL;

const RATE_LIMIT_RULES = [
  { id: "short", limit: 2, windowMs: 60_000 },
  { id: "daily", limit: 4, windowMs: 24 * 60 * 60 * 1000 },
] as const satisfies readonly RateLimitRule[];

function hasPostgresCode(code: string) {
  return (error: unknown) =>
    typeof error === "object" && error !== null && "code" in error && error.code === code;
}

async function applyMigration(database: Client, directory: string) {
  const sql = await readFile(
    resolve(process.cwd(), "prisma/migrations", directory, "migration.sql"),
    "utf8",
  );

  await database.query(sql);
}

async function readRecords(database: Client, keyHash: string) {
  const records = await database.query<{
    ruleId: string;
    count: number;
    resetAt: Date;
  }>(
    `
      SELECT rule_id AS "ruleId", count, reset_at AS "resetAt"
      FROM public.rate_limits
      WHERE scope = 'chat' AND key_hash = $1
      ORDER BY rule_id
    `,
    [keyHash],
  );

  return records.rows;
}

async function assertRoleCannotAccess(database: Client, role: "anon" | "authenticated") {
  await database.query(`SET ROLE ${role}`);

  try {
    await assert.rejects(
      database.query(`SELECT scope FROM public.rate_limits LIMIT 1`),
      hasPostgresCode("42501"),
    );
  } finally {
    await database.query(`RESET ROLE`);
  }
}

test(
  "rate-limit migration, transaction semantics, concurrency, and private-table posture work on PostgreSQL",
  { skip: !adminConnectionUrl, timeout: 180_000 },
  async () => {
    const databaseName = `rate_limit_test_${randomUUID().replaceAll("-", "")}`;

    const adminUrl = new URL(adminConnectionUrl!);

    const databaseUrl = new URL(adminConnectionUrl!);

    databaseUrl.pathname = `/${databaseName}`;

    const admin = new Client({ connectionString: adminUrl.toString() });

    let database: Client | undefined;

    let primaryPrisma: PrismaClient | undefined;

    let concurrentPrisma: PrismaClient | undefined;

    await admin.connect();
    await admin.query(`CREATE DATABASE "${databaseName}"`);

    try {
      database = new Client({ connectionString: databaseUrl.toString() });
      await database.connect();

      const migrationDirectories = (await readdir(resolve(process.cwd(), "prisma/migrations")))
        .filter((directory) => /^\d+_/.test(directory))
        .sort();

      for (const directory of migrationDirectories) {
        await applyMigration(database, directory);
      }

      const posture = await database.query<{
        rlsEnabled: boolean;
        publicAccess: boolean;
        anonAccess: boolean;
        authenticatedAccess: boolean;
        policies: string;
      }>(`
        SELECT
          table_class.relrowsecurity AS "rlsEnabled",
          EXISTS (
            SELECT 1
            FROM aclexplode(
              COALESCE(table_class.relacl, acldefault('r', table_class.relowner))
            ) AS privilege
            WHERE privilege.grantee = 0
          ) AS "publicAccess",
          has_table_privilege('anon', 'public.rate_limits', 'SELECT,INSERT,UPDATE,DELETE') AS "anonAccess",
          has_table_privilege(
            'authenticated',
            'public.rate_limits',
            'SELECT,INSERT,UPDATE,DELETE'
          ) AS "authenticatedAccess",
          (
            SELECT COUNT(*)
            FROM pg_policy
            WHERE polrelid = 'public.rate_limits'::regclass
          ) AS policies
        FROM pg_class AS table_class
        JOIN pg_namespace AS table_namespace ON table_namespace.oid = table_class.relnamespace
        WHERE table_namespace.nspname = 'public'
          AND table_class.relname = 'rate_limits'
      `);

      assert.deepEqual(posture.rows[0], {
        rlsEnabled: true,
        publicAccess: false,
        anonAccess: false,
        authenticatedAccess: false,
        policies: "0",
      });
      await assertRoleCannotAccess(database, "anon");
      await assertRoleCannotAccess(database, "authenticated");

      const invalidInsert = (scope: string, keyHash: string, ruleId: string, count: number) =>
        database!.query(
          `
            INSERT INTO public.rate_limits (scope, key_hash, rule_id, count, reset_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          `,
          [scope, keyHash, ruleId, count],
        );

      await assert.rejects(invalidInsert("", "hash", "short", 0), hasPostgresCode("23514"));
      await assert.rejects(invalidInsert("chat", "", "short", 0), hasPostgresCode("23514"));
      await assert.rejects(invalidInsert("chat", "hash", "", 0), hasPostgresCode("23514"));
      await assert.rejects(invalidInsert("chat", "hash", "short", -1), hasPostgresCode("23514"));

      primaryPrisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: databaseUrl.toString() }),
      });
      concurrentPrisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: databaseUrl.toString() }),
      });

      const rateLimits = new RateLimitRepository(primaryPrisma);

      const concurrentRateLimits = new RateLimitRepository(concurrentPrisma);

      const now = new Date("2026-08-21T12:00:00.000Z");

      const first = await rateLimits.consume({
        scope: "chat",
        keyHash: "visitor-one-hash",
        rules: RATE_LIMIT_RULES,
        now,
      });

      assert.deepEqual(first, { allowed: true });
      assert.deepEqual(await readRecords(database, "visitor-one-hash"), [
        {
          ruleId: "daily",
          count: 1,
          resetAt: new Date(now.getTime() + RATE_LIMIT_RULES[1].windowMs),
        },
        {
          ruleId: "short",
          count: 1,
          resetAt: new Date(now.getTime() + RATE_LIMIT_RULES[0].windowMs),
        },
      ]);

      assert.deepEqual(
        await rateLimits.consume({
          scope: "chat",
          keyHash: "visitor-one-hash",
          rules: RATE_LIMIT_RULES,
          now,
        }),
        { allowed: true },
      );

      const rejected = await rateLimits.consume({
        scope: "chat",
        keyHash: "visitor-one-hash",
        rules: RATE_LIMIT_RULES,
        now,
      });

      assert.deepEqual(rejected, {
        allowed: false,
        limit: 2,
        remaining: 0,
        resetAt: now.getTime() + RATE_LIMIT_RULES[0].windowMs,
      });
      assert.deepEqual(await readRecords(database, "visitor-one-hash"), [
        {
          ruleId: "daily",
          count: 2,
          resetAt: new Date(now.getTime() + RATE_LIMIT_RULES[1].windowMs),
        },
        {
          ruleId: "short",
          count: 2,
          resetAt: new Date(now.getTime() + RATE_LIMIT_RULES[0].windowMs),
        },
      ]);

      assert.deepEqual(
        await rateLimits.consume({
          scope: "chat",
          keyHash: "expired-hash",
          rules: RATE_LIMIT_RULES,
          now,
        }),
        { allowed: true },
      );
      const afterShortExpiry = new Date(now.getTime() + RATE_LIMIT_RULES[0].windowMs + 1);

      assert.deepEqual(
        await rateLimits.consume({
          scope: "chat",
          keyHash: "expired-hash",
          rules: RATE_LIMIT_RULES,
          now: afterShortExpiry,
        }),
        { allowed: true },
      );
      assert.deepEqual(await readRecords(database, "expired-hash"), [
        {
          ruleId: "daily",
          count: 2,
          resetAt: new Date(now.getTime() + RATE_LIMIT_RULES[1].windowMs),
        },
        {
          ruleId: "short",
          count: 1,
          resetAt: new Date(afterShortExpiry.getTime() + RATE_LIMIT_RULES[0].windowMs),
        },
      ]);

      const concurrentRules = [
        { id: "short", limit: 5, windowMs: 60_000 },
        { id: "daily", limit: 5, windowMs: 24 * 60 * 60 * 1000 },
      ] as const satisfies readonly RateLimitRule[];

      const concurrentRequests = Array.from({ length: 16 }, (_, index) =>
        (index % 2 === 0 ? rateLimits : concurrentRateLimits).consume({
          scope: "chat",
          keyHash: "concurrent-hash",
          rules: concurrentRules,
          now,
        }),
      );

      const concurrentResults = await Promise.all(concurrentRequests);

      assert.equal(concurrentResults.filter((result) => result.allowed).length, 5);
      assert.deepEqual(await readRecords(database, "concurrent-hash"), [
        {
          ruleId: "daily",
          count: 5,
          resetAt: new Date(now.getTime() + concurrentRules[1].windowMs),
        },
        {
          ruleId: "short",
          count: 5,
          resetAt: new Date(now.getTime() + concurrentRules[0].windowMs),
        },
      ]);
    } finally {
      await primaryPrisma?.$disconnect();
      await concurrentPrisma?.$disconnect();
      await database?.end();
      await admin.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`,
        [databaseName],
      );
      await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await admin.end();
    }
  },
);
