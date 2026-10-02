import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { WorkflowInstanceStoreError } from "@/modules/workflow/errors";
import { WorkflowInstanceRepository } from "@/modules/workflow/repository";

const adminConnectionUrl = process.env.PORTFOLIO_TEST_DATABASE_URL;

const WORKFLOW_MIGRATION = "20260820120000_add_workflow_instances";

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

async function assertRoleCannotRead(database: Client, role: "anon" | "authenticated") {
  await database.query(`SET ROLE ${role}`);

  try {
    await assert.rejects(
      database.query(`SELECT id FROM public.workflow_instances LIMIT 1`),
      hasPostgresCode("42501"),
    );
  } finally {
    await database.query(`RESET ROLE`);
  }
}

test(
  "workflow migration, private access, and repository terminal updates work on PostgreSQL",
  { skip: !adminConnectionUrl, timeout: 180_000 },
  async () => {
    const databaseName = `milestone18_test_${randomUUID().replaceAll("-", "")}`;

    const adminUrl = new URL(adminConnectionUrl!);

    const databaseUrl = new URL(adminConnectionUrl!);

    databaseUrl.pathname = `/${databaseName}`;

    const admin = new Client({ connectionString: adminUrl.toString() });

    let database: Client | undefined;

    let prisma: PrismaClient | undefined;

    await admin.connect();
    await admin.query(`CREATE DATABASE "${databaseName}"`);

    try {
      database = new Client({ connectionString: databaseUrl.toString() });
      await database.connect();

      const migrationDirectories = (await readdir(resolve(process.cwd(), "prisma/migrations")))
        .filter((directory) => /^\d+_/.test(directory))
        .sort();

      const workflowMigrationIndex = migrationDirectories.indexOf(WORKFLOW_MIGRATION);

      assert.notEqual(workflowMigrationIndex, -1);

      for (const directory of migrationDirectories.slice(0, workflowMigrationIndex)) {
        await applyMigration(database, directory);
      }

      await database.query(`
        INSERT INTO public.meetings (
          google_event_id, name, email, timezone, reason, starts_at, ends_at, status,
          raw_provider_payload
        ) VALUES (
          'workflow-protected-event', 'Protected', 'protected@example.test',
          'Europe/London', 'proof', NOW(), NOW() + INTERVAL '30 minutes',
          'confirmed', '{}'
        )
      `);

      for (const directory of migrationDirectories.slice(workflowMigrationIndex)) {
        await applyMigration(database, directory);
      }

      const migrated = await database.query<{
        meetings: string;
        workflow_table: boolean;
        rls_enabled: boolean;
        public_access: boolean;
        anon_access: boolean;
        authenticated_access: boolean;
        policies: string;
      }>(`
        SELECT
          (SELECT COUNT(*) FROM public.meetings) AS meetings,
          to_regclass('public.workflow_instances') IS NOT NULL AS workflow_table,
          table_class.relrowsecurity AS rls_enabled,
          EXISTS (
            SELECT 1
            FROM aclexplode(
              COALESCE(table_class.relacl, acldefault('r', table_class.relowner))
            ) AS privilege
            WHERE privilege.grantee = 0
          ) AS public_access,
          has_table_privilege('anon', 'public.workflow_instances', 'SELECT,INSERT,UPDATE,DELETE') AS anon_access,
          has_table_privilege(
            'authenticated',
            'public.workflow_instances',
            'SELECT,INSERT,UPDATE,DELETE'
          ) AS authenticated_access,
          (
            SELECT COUNT(*)
            FROM pg_policy
            WHERE polrelid = 'public.workflow_instances'::regclass
          ) AS policies
        FROM pg_class AS table_class
        JOIN pg_namespace AS table_namespace ON table_namespace.oid = table_class.relnamespace
        WHERE table_namespace.nspname = 'public'
          AND table_class.relname = 'workflow_instances'
      `);

      assert.deepEqual(migrated.rows[0], {
        meetings: "1",
        workflow_table: true,
        rls_enabled: true,
        public_access: false,
        anon_access: false,
        authenticated_access: false,
        policies: "0",
      });
      await assertRoleCannotRead(database, "anon");
      await assertRoleCannotRead(database, "authenticated");

      const invalidInsert = (version: number, status: string, state: unknown) =>
        database!.query(
          `
            INSERT INTO public.workflow_instances (
              workflow_id, workflow_version, status, state, origin_channel
            ) VALUES ('meeting-booking', $1, $2, $3::jsonb, 'web')
          `,
          [version, status, JSON.stringify(state)],
        );

      await assert.rejects(invalidInsert(0, "active", {}), hasPostgresCode("23514"));
      await assert.rejects(invalidInsert(1, "unknown", {}), hasPostgresCode("23514"));
      await assert.rejects(invalidInsert(1, "active", []), hasPostgresCode("23514"));

      prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: databaseUrl.toString() }),
      });

      const repository = new WorkflowInstanceRepository(prisma);

      const created = await repository.create({
        workflowId: "meeting-booking",
        workflowVersion: 1,
        state: { step: "collecting" },
        originChannel: "web",
        originPage: "/about",
        originEntry: "book-a-call",
      });

      assert.equal(created.status, "active");
      assert.deepEqual((await repository.findById(created.id))?.state, { step: "collecting" });

      const completedAt = new Date("2026-08-20T12:00:00.000Z");

      const completed = await repository.save({
        id: created.id,
        expectedRevision: created.revision,
        status: "completed",
        state: { step: "confirmed" },
        completedAt,
      });

      assert.equal(completed.status, "completed");
      assert.deepEqual(completed.completedAt, completedAt);
      await assert.rejects(
        repository.save({
          id: created.id,
          expectedRevision: completed.revision,
          status: "active",
          state: { step: "reopened" },
          completedAt: null,
        }),
        (error: unknown) =>
          error instanceof WorkflowInstanceStoreError && error.code === "terminal",
      );
      assert.deepEqual(await repository.findById(created.id), completed);
    } finally {
      await prisma?.$disconnect();
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
