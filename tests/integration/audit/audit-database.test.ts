import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { AuditRequestRepository } from "@/server/modules/audit/repositories/audit-request.repository";

const adminConnectionUrl = process.env.PORTFOLIO_TEST_DATABASE_URL;

const AUDIT_MIGRATION = "20260820130000_add_audit_requests";

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
      database.query(`SELECT id FROM public.audit_requests LIMIT 1`),
      hasPostgresCode("42501"),
    );
  } finally {
    await database.query(`RESET ROLE`);
  }
}

test(
  "Audit migration is private and repository submission is idempotent on PostgreSQL",
  { skip: !adminConnectionUrl, timeout: 180_000 },
  async () => {
    const databaseName = `milestone19_test_${randomUUID().replaceAll("-", "")}`;

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

      assert.notEqual(migrationDirectories.indexOf(AUDIT_MIGRATION), -1);

      for (const directory of migrationDirectories) {
        await applyMigration(database, directory);
      }

      const security = await database.query<{
        rls_enabled: boolean;
        public_access: boolean;
        anon_access: boolean;
        authenticated_access: boolean;
        policies: string;
      }>(`
        SELECT
          table_class.relrowsecurity AS rls_enabled,
          EXISTS (
            SELECT 1
            FROM aclexplode(
              COALESCE(table_class.relacl, acldefault('r', table_class.relowner))
            ) AS privilege
            WHERE privilege.grantee = 0
          ) AS public_access,
          has_table_privilege('anon', 'public.audit_requests', 'SELECT,INSERT,UPDATE,DELETE') AS anon_access,
          has_table_privilege(
            'authenticated',
            'public.audit_requests',
            'SELECT,INSERT,UPDATE,DELETE'
          ) AS authenticated_access,
          (
            SELECT COUNT(*)
            FROM pg_policy
            WHERE polrelid = 'public.audit_requests'::regclass
          ) AS policies
        FROM pg_class AS table_class
        JOIN pg_namespace AS table_namespace ON table_namespace.oid = table_class.relnamespace
        WHERE table_namespace.nspname = 'public'
          AND table_class.relname = 'audit_requests'
      `);

      assert.deepEqual(security.rows[0], {
        rls_enabled: true,
        public_access: false,
        anon_access: false,
        authenticated_access: false,
        policies: "0",
      });

      await assertRoleCannotRead(database, "anon");
      await assertRoleCannotRead(database, "authenticated");

      prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: databaseUrl.toString() }),
      });

      const workflow = await prisma.workflowInstance.create({
        data: {
          workflowId: "audit",
          workflowVersion: 1,
          status: "active",
          state: {},
          originChannel: "web",
          originPage: "/audit",
          originEntry: "audit-hero-cta",
        },
      });

      const repository = new AuditRequestRepository(prisma);

      const input = {
        workflowInstanceId: workflow.id,
        focus: "Customer onboarding",
        currentProcess: "A form reaches a shared inbox.",
        friction: "Follow-up is delayed.",
        desiredOutcome: "A prompt, reliable next step.",
        name: "Visitor",
        email: "visitor@example.com",
        businessName: null,
        websiteUrl: null,
        additionalContext: null,
      };

      const created = await repository.createOrFind(input);

      const retried = await repository.createOrFind(input);

      assert.equal(retried.id, created.id);
      assert.equal(await prisma.auditRequest.count(), 1);
      assert.equal((await repository.list())[0]?.id, created.id);

      await assert.rejects(
        database.query(
          `
            INSERT INTO public.audit_requests (
              workflow_instance_id, focus, current_process, friction, desired_outcome, name, email
            ) VALUES ($1, 'Other', 'Other', 'Other', 'Other', 'Other', 'other@example.com')
          `,
          [workflow.id],
        ),
        hasPostgresCode("23505"),
      );
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
