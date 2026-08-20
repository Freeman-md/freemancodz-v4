import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { WorkflowInstanceRepositoryError } from "@/server/modules/workflow/interfaces/workflow-instance.repository.interface";
import { WorkflowInstanceRepository } from "@/server/modules/workflow/repositories/workflow-instance.repository";

const adminConnectionUrl = process.env.PORTFOLIO_TEST_DATABASE_URL;

const WORKFLOW_MIGRATION = "20260820120000_add_workflow_instances";

const PROJECT_ID = "30000000-0000-0000-0000-000000000018";

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
  "Milestone 18 migrates and constrains workflow instances on disposable PostgreSQL",
  { skip: !adminConnectionUrl, timeout: 180_000 },
  async (context) => {
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

      assert.notEqual(workflowMigrationIndex, -1, "Expected the Milestone 18 migration.");

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
        );

        INSERT INTO public.site_chunks (
          id, source_type, source_id, chunk_index, title, category, url, content,
          keywords, embedding
        ) VALUES (
          'workflow-protected-chunk', 'project', '${PROJECT_ID}', 0,
          'Protected', 'proof', '/work', 'protected', ARRAY['protected'],
          array_fill(0.01::real, ARRAY[1536])::vector
        );

        INSERT INTO public.profiles (
          id, name, title, positioning, email, linkedin_url, github_url
        ) VALUES (
          'global', 'Protected profile', 'Engineer', 'Positioning',
          'profile@example.test', 'https://example.test/linkedin',
          'https://example.test/github'
        );

        INSERT INTO public.projects (
          id, slug, title, category, problem, solution, featured, "order"
        ) VALUES (
          '${PROJECT_ID}', 'workflow-protected-project', 'Protected project', 'Proof',
          'Problem', 'Solution', false, 1
        );
      `);

      for (const directory of migrationDirectories.slice(workflowMigrationIndex)) {
        await applyMigration(database, directory);
      }

      prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: databaseUrl.toString() }),
      });

      await context.test(
        "preserves existing application data through the forward migration",
        async () => {
          const result = await database!.query<{
            meetings: string;
            chunks: string;
            profiles: string;
            projects: string;
            jobs: string;
            workflow_table: boolean;
          }>(`
          SELECT
            (SELECT COUNT(*) FROM public.meetings) AS meetings,
            (SELECT COUNT(*) FROM public.site_chunks) AS chunks,
            (SELECT COUNT(*) FROM public.profiles) AS profiles,
            (SELECT COUNT(*) FROM public.projects) AS projects,
            (SELECT COUNT(*) FROM public.search_index_jobs) AS jobs,
            to_regclass('public.workflow_instances') IS NOT NULL AS workflow_table
        `);

          assert.deepEqual(result.rows[0], {
            meetings: "1",
            chunks: "1",
            profiles: "1",
            projects: "1",
            jobs: "1",
            workflow_table: true,
          });
        },
      );

      await context.test("creates active instances with private JSON object state", async () => {
        const result = await database!.query<{
          id: string;
          status: string;
          state: unknown;
          origin_page: string | null;
          origin_entry: string | null;
          started_at: Date;
          completed_at: Date | null;
          updated_at: Date;
        }>(
          `
            INSERT INTO public.workflow_instances (
              workflow_id, workflow_version, state, origin_channel, origin_page, origin_entry
            ) VALUES ($1, $2, $3::jsonb, $4, $5, $6)
            RETURNING id, status, state, origin_page, origin_entry, started_at, completed_at, updated_at
          `,
          [
            "meeting-booking",
            1,
            JSON.stringify({ step: "collecting_details" }),
            "web",
            "/about",
            "book-a-call",
          ],
        );

        assert.match(
          result.rows[0]!.id,
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
        assert.equal(result.rows[0]!.status, "active");
        assert.deepEqual(result.rows[0]!.state, { step: "collecting_details" });
        assert.equal(result.rows[0]!.origin_page, "/about");
        assert.equal(result.rows[0]!.origin_entry, "book-a-call");
        assert.ok(result.rows[0]!.started_at instanceof Date);
        assert.equal(result.rows[0]!.completed_at, null);
        assert.ok(result.rows[0]!.updated_at instanceof Date);

        const completed = await database!.query<{ status: string; completed_at: Date }>(
          `
            UPDATE public.workflow_instances
            SET status = 'completed', completed_at = statement_timestamp()
            WHERE id = $1
            RETURNING status, completed_at
          `,
          [result.rows[0]!.id],
        );

        assert.equal(completed.rows[0]!.status, "completed");
        assert.ok(completed.rows[0]!.completed_at instanceof Date);
      });

      await context.test(
        "rejects invalid versions, statuses, state shapes, and completion timestamps",
        async () => {
          const insert = (
            workflowVersion: number,
            status: string,
            state: unknown,
            completedAt: Date | null = null,
          ) =>
            database!.query(
              `
              INSERT INTO public.workflow_instances (
                workflow_id, workflow_version, status, state, origin_channel, completed_at
              ) VALUES ('meeting-booking', $1, $2, $3::jsonb, 'web', $4)
            `,
              [workflowVersion, status, JSON.stringify(state), completedAt],
            );

          await assert.rejects(insert(0, "active", {}), hasPostgresCode("23514"));
          await assert.rejects(insert(1, "unknown", {}), hasPostgresCode("23514"));
          await assert.rejects(insert(1, "active", []), hasPostgresCode("23514"));
          await assert.rejects(insert(1, "completed", {}), hasPostgresCode("23514"));
          await assert.rejects(insert(1, "cancelled", {}, new Date()), hasPostgresCode("23514"));
          await assert.rejects(
            database!.query(`
              INSERT INTO public.workflow_instances (
                workflow_id, workflow_version, state, origin_channel
              ) VALUES ('  ', 1, '{}', 'web')
            `),
            hasPostgresCode("23514"),
          );
          await assert.rejects(
            database!.query(`
              INSERT INTO public.workflow_instances (
                workflow_id, workflow_version, state, origin_channel
              ) VALUES ('meeting-booking', 1, '{}', '  ')
            `),
            hasPostgresCode("23514"),
          );
        },
      );

      await context.test(
        "keeps the table outside public and authenticated Data API access",
        async () => {
          const result = await database!.query<{
            rls_enabled: boolean;
            public_table_access: boolean;
            anon_table_access: boolean;
            authenticated_table_access: boolean;
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
            ) AS public_table_access,
            (
              has_table_privilege('anon', 'public.workflow_instances', 'SELECT')
              OR has_table_privilege('anon', 'public.workflow_instances', 'INSERT')
              OR has_table_privilege('anon', 'public.workflow_instances', 'UPDATE')
              OR has_table_privilege('anon', 'public.workflow_instances', 'DELETE')
              OR has_table_privilege('anon', 'public.workflow_instances', 'TRUNCATE')
              OR has_table_privilege('anon', 'public.workflow_instances', 'REFERENCES')
              OR has_table_privilege('anon', 'public.workflow_instances', 'TRIGGER')
            ) AS anon_table_access,
            (
              has_table_privilege('authenticated', 'public.workflow_instances', 'SELECT')
              OR has_table_privilege('authenticated', 'public.workflow_instances', 'INSERT')
              OR has_table_privilege('authenticated', 'public.workflow_instances', 'UPDATE')
              OR has_table_privilege('authenticated', 'public.workflow_instances', 'DELETE')
              OR has_table_privilege('authenticated', 'public.workflow_instances', 'TRUNCATE')
              OR has_table_privilege('authenticated', 'public.workflow_instances', 'REFERENCES')
              OR has_table_privilege('authenticated', 'public.workflow_instances', 'TRIGGER')
            ) AS authenticated_table_access,
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

          assert.deepEqual(result.rows[0], {
            rls_enabled: true,
            public_table_access: false,
            anon_table_access: false,
            authenticated_table_access: false,
            policies: "0",
          });

          await assertRoleCannotRead(database!, "anon");
          await assertRoleCannotRead(database!, "authenticated");
        },
      );

      await context.test("persists lifecycle changes through the repository", async () => {
        const repository = new WorkflowInstanceRepository(prisma!);

        const created = await repository.create({
          workflowId: "meeting-booking",
          workflowVersion: 1,
          state: { step: "collecting_details" },
          originChannel: "web",
          originPage: "/about",
          originEntry: "book-a-call",
        });

        assert.equal(created.status, "active");
        assert.equal(created.completedAt, null);
        assert.deepEqual(created.state, { step: "collecting_details" });

        const found = await repository.findById(created.id);

        assert.deepEqual(found, created);
        assert.equal(await repository.findById(randomUUID()), null);

        const advanced = await repository.save({
          id: created.id,
          status: "active",
          state: { step: "awaiting_confirmation", confirmed: false },
          completedAt: null,
        });

        assert.equal(advanced.status, "active");
        assert.deepEqual(advanced.state, {
          step: "awaiting_confirmation",
          confirmed: false,
        });

        const completedAt = new Date("2026-08-20T12:00:00.000Z");

        const completed = await repository.save({
          id: created.id,
          status: "completed",
          state: { step: "confirmed" },
          completedAt,
        });

        assert.equal(completed.status, "completed");
        assert.deepEqual(completed.state, { step: "confirmed" });
        assert.deepEqual(completed.completedAt, completedAt);

        await assert.rejects(
          repository.save({
            id: created.id,
            status: "active",
            state: { step: "reopened" },
            completedAt: null,
          }),
          (error: unknown) =>
            error instanceof WorkflowInstanceRepositoryError && error.code === "terminal",
        );

        assert.deepEqual(await repository.findById(created.id), completed);
      });
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
