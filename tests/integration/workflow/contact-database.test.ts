import { applyPrismaMigration } from "../apply-prisma-migration";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { ContactRequestRepository } from "@/modules/contact/repository";

const adminConnectionUrl = process.env.PORTFOLIO_TEST_DATABASE_URL;

const CONTACT_MIGRATION = "20260923200500_add_contact_requests";

function hasPostgresCode(code: string) {
  return (error: unknown) =>
    typeof error === "object" && error !== null && "code" in error && error.code === code;
}

async function assertRoleCannotRead(database: Client, role: "anon" | "authenticated") {
  await database.query(`SET ROLE ${role}`);

  try {
    await assert.rejects(
      database.query("SELECT id FROM public.contact_requests LIMIT 1"),
      hasPostgresCode("42501"),
    );
  } finally {
    await database.query("RESET ROLE");
  }
}

test(
  "Contact migration is private and repository submission is idempotent on PostgreSQL",
  { skip: !adminConnectionUrl, timeout: 180_000 },
  async () => {
    const databaseName = `milestone21_test_${randomUUID().replaceAll("-", "")}`;

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

      assert.notEqual(migrationDirectories.indexOf(CONTACT_MIGRATION), -1);
      for (const directory of migrationDirectories) {
        await applyPrismaMigration(database, directory, databaseUrl.href);
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
            SELECT 1 FROM aclexplode(
              COALESCE(table_class.relacl, acldefault('r', table_class.relowner))
            ) AS privilege WHERE privilege.grantee = 0
          ) AS public_access,
          has_table_privilege('anon', 'public.contact_requests', 'SELECT,INSERT,UPDATE,DELETE') AS anon_access,
          has_table_privilege('authenticated', 'public.contact_requests', 'SELECT,INSERT,UPDATE,DELETE') AS authenticated_access,
          (SELECT COUNT(*) FROM pg_policy WHERE polrelid = 'public.contact_requests'::regclass) AS policies
        FROM pg_class AS table_class
        JOIN pg_namespace AS table_namespace ON table_namespace.oid = table_class.relnamespace
        WHERE table_namespace.nspname = 'public'
          AND table_class.relname = 'contact_requests'
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
          workflowId: "contact",
          workflowVersion: 1,
          status: "active",
          state: {},
          originChannel: "web",
          originPage: "/",
          originEntry: "assistant-starter-contact",
        },
      });

      const repository = new ContactRequestRepository(prisma);

      const input = {
        workflowInstanceId: workflow.id,
        name: "Visitor",
        email: "visitor@example.com",
        message: "I would like to discuss a project.",
        businessName: null,
      };

      const created = await repository.createOrFind(input);

      const retried = await repository.createOrFind(input);

      assert.equal(retried.id, created.id);
      assert.equal(await prisma.contactRequest.count(), 1);
      assert.equal((await repository.list())[0]?.id, created.id);
      await assert.rejects(
        database.query(
          "INSERT INTO public.contact_requests (workflow_instance_id, name, email, message) VALUES ($1, 'Other', 'other@example.com', 'Other')",
          [workflow.id],
        ),
        hasPostgresCode("23505"),
      );
    } finally {
      await prisma?.$disconnect();
      await database?.end();
      await admin.query(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1",
        [databaseName],
      );
      await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await admin.end();
    }
  },
);
