import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import {
  resetPortfolio,
  seedPortfolio,
  verifyPortfolio,
} from "../../../prisma/portfolio-bootstrap";
import type { ISupabaseStorageProvider } from "@/server/modules/portfolio/interfaces/supabase-storage.provider.interface";

const adminConnectionUrl = process.env.PORTFOLIO_TEST_DATABASE_URL;

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

async function portfolioCounts(database: Client) {
  const result = await database.query<{
    profiles: string;
    content_blocks: string;
    icon_blocks: string;
    media_blocks: string;
    action_blocks: string;
    projects: string;
    experiences: string;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM profiles) AS profiles,
      (SELECT COUNT(*) FROM content_blocks) AS content_blocks,
      (SELECT COUNT(*) FROM icon_blocks) AS icon_blocks,
      (SELECT COUNT(*) FROM media_blocks) AS media_blocks,
      (SELECT COUNT(*) FROM action_blocks) AS action_blocks,
      (SELECT COUNT(*) FROM projects) AS projects,
      (SELECT COUNT(*) FROM experiences) AS experiences
  `);

  return Object.values(result.rows[0]!).map(Number);
}

test(
  "Milestone 15 migrates, constrains, seeds, resets, and rolls back on disposable PostgreSQL",
  { skip: !adminConnectionUrl, timeout: 120_000 },
  async (context) => {
    const databaseName = `milestone15_test_${randomUUID().replaceAll("-", "")}`;

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

      const milestoneMigration = migrationDirectories.at(-1)!;

      for (const directory of migrationDirectories.slice(0, -1)) {
        await applyMigration(database, directory);
      }

      await database.query(`
        INSERT INTO meetings (
          google_event_id, name, email, timezone, reason, starts_at, ends_at, status,
          raw_provider_payload
        ) VALUES (
          'protected-event', 'Protected', 'protected@example.test', 'Europe/London', 'proof',
          NOW(), NOW() + INTERVAL '30 minutes', 'confirmed', '{}'
        );
        INSERT INTO site_chunks (
          id, source_type, source_id, chunk_index, title, category, url, content, keywords, embedding
        ) VALUES (
          'protected-chunk', 'project', '00000000-0000-0000-0000-000000000001', 0,
          'Protected', 'proof', '/work', 'protected', ARRAY['protected'],
          array_fill(0::real, ARRAY[1536])::vector
        );
        INSERT INTO search_index_jobs (
          source_type, source_id, operation, status, available_at, attempts
        ) VALUES (
          'project', '00000000-0000-0000-0000-000000000001', 'upsert', 'pending', NOW(), 0
        );
      `);

      await applyMigration(database, milestoneMigration);

      await context.test("preserves protected rows and retrieval infrastructure", async () => {
        const result = await database!.query<{
          meetings: string;
          chunks: string;
          jobs: string;
          match_function: boolean;
        }>(`
          SELECT
            (SELECT COUNT(*) FROM meetings) AS meetings,
            (SELECT COUNT(*) FROM site_chunks) AS chunks,
            (SELECT COUNT(*) FROM search_index_jobs) AS jobs,
            to_regprocedure('match_site_chunks(vector,integer,double precision)') IS NOT NULL
              AS match_function
        `);

        assert.deepEqual(result.rows[0], {
          meetings: "1",
          chunks: "1",
          jobs: "1",
          match_function: true,
        });
      });

      await context.test(
        "rejects invalid singleton, action, and ordered junction records",
        async () => {
          await assert.rejects(
            database!.query(`
            INSERT INTO profiles (
              id, name, title, positioning, email, linkedin_url, github_url
            ) VALUES (
              'other', 'Other', 'Title', 'Position', 'other@example.test',
              'https://example.test/linkedin', 'https://example.test/github'
            )
          `),
            hasPostgresCode("23514"),
          );
          await database!.query(`
          INSERT INTO profiles (name, title, positioning, email, linkedin_url, github_url)
          VALUES (
            'One', 'Title', 'Position', 'one@example.test',
            'https://example.test/linkedin', 'https://example.test/github'
          )
        `);
          await assert.rejects(
            database!.query(`
            INSERT INTO profiles (name, title, positioning, email, linkedin_url, github_url)
            VALUES (
              'Two', 'Title', 'Position', 'two@example.test',
              'https://example.test/linkedin', 'https://example.test/github'
            )
          `),
            hasPostgresCode("23505"),
          );
          const content = await database!.query<{ id: string }>(
            `INSERT INTO content_blocks (url, "order") VALUES ('/', 1) RETURNING id`,
          );

          const icons = await database!.query<{ id: string }>(`
          INSERT INTO icon_blocks (label) VALUES ('One'), ('Two') RETURNING id
        `);

          await assert.rejects(
            database!.query(`INSERT INTO action_blocks (id, variant) VALUES ($1, 'primary')`, [
              icons.rows[0]!.id,
            ]),
            hasPostgresCode("23514"),
          );
          await database!.query(
            `
            INSERT INTO content_block_icon_blocks (content_block_id, icon_block_id, "order")
            VALUES ($1, $2, 1)
          `,
            [content.rows[0]!.id, icons.rows[0]!.id],
          );
          await assert.rejects(
            database!.query(
              `
              INSERT INTO content_block_icon_blocks (content_block_id, icon_block_id, "order")
              VALUES ($1, $2, 1)
            `,
              [content.rows[0]!.id, icons.rows[1]!.id],
            ),
            hasPostgresCode("23505"),
          );
        },
      );

      prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: databaseUrl.toString() }),
      });

      await resetPortfolio(prisma);

      const storage: ISupabaseStorageProvider = {
        ensurePublicBucket: async () => undefined,
        hasObject: async () => true,
        uploadIfMissing: async ({ objectPath }) => `https://portfolio.test/${objectPath}`,
        getPublicUrl: (objectPath) => `https://portfolio.test/${objectPath}`,
      };

      await context.test(
        "rolls back every database seed record after a mid-seed failure",
        async () => {
          await database!.query(`
          CREATE FUNCTION reject_portfolio_content_block() RETURNS trigger LANGUAGE plpgsql AS $$
          BEGIN
            RAISE EXCEPTION 'simulated portfolio seed failure';
          END;
          $$;
          CREATE TRIGGER reject_portfolio_content_block
          BEFORE INSERT ON content_blocks
          FOR EACH ROW EXECUTE FUNCTION reject_portfolio_content_block();
        `);

          await assert.rejects(seedPortfolio(prisma!, storage), /simulated portfolio seed failure/);
          assert.deepEqual(await portfolioCounts(database!), [0, 0, 0, 0, 0, 0, 0]);
          await database!.query(`
          DROP TRIGGER reject_portfolio_content_block ON content_blocks;
          DROP FUNCTION reject_portfolio_content_block();
        `);
        },
      );

      await context.test(
        "seeds exact totals and resets only portfolio-domain records",
        async () => {
          await seedPortfolio(prisma!, storage);
          assert.deepEqual(await verifyPortfolio(prisma!), {
            profiles: 1,
            projects: 6,
            experiences: 4,
            topLevelBlocks: 22,
          });
          assert.deepEqual(
            await prisma!.project.findMany({ orderBy: { order: "asc" }, select: { title: true } }),
            [
              { title: "Pay4Me / WithRadius" },
              { title: "Portfolio Assistant" },
              { title: "Email PA" },
              { title: "AcrossTheHorizon" },
              { title: "Shifty" },
              { title: "Self-Healing Backend Operations System" },
            ],
          );

          await resetPortfolio(prisma!);
          assert.deepEqual(await portfolioCounts(database!), [0, 0, 0, 0, 0, 0, 0]);
          const protectedRows = await database!.query<{
            meetings: string;
            chunks: string;
            jobs: string;
          }>(`
          SELECT
            (SELECT COUNT(*) FROM meetings) AS meetings,
            (SELECT COUNT(*) FROM site_chunks) AS chunks,
            (SELECT COUNT(*) FROM search_index_jobs) AS jobs
        `);

          assert.deepEqual(protectedRows.rows[0], { meetings: "1", chunks: "1", jobs: "1" });
        },
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
