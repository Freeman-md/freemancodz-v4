import { applyPrismaMigration, portfolioSeedFixture } from "../apply-prisma-migration";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import test from "node:test";
import { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPublicPortfolioRepository } from "@/modules/portfolio/repositories/public-portfolio.repository";
import { PublicPortfolioService } from "@/modules/portfolio/services/public-portfolio.service";
import { PrismaPortfolioSeedRepository } from "@/modules/portfolio/repositories/portfolio-seed.repository";
import { PortfolioSeedService } from "@/modules/portfolio/seed.service";
import { verifyPortfolioTarget } from "@/infrastructure/config/portfolio-database";
import { seedPortfolioSchema } from "@/modules/portfolio/data/portfolio.schema";
const additive = "20261109130000_add_public_portfolio";

const cleanup = "20261109131000_remove_legacy_portfolio";

const target = process.env.PORTFOLIO_TEST_DATABASE_URL;

const baseline = seedPortfolioSchema.parse(portfolioSeedFixture);

const noEdits = {
  profile: baseline.profile,
  projects: [],
  caseStudies: [],
  experience: [],
  services: [],
};

const legacyTables = [
  "profiles",
  "projects",
  "experiences",
  "content_blocks",
  "icon_blocks",
  "media_blocks",
  "action_blocks",
  "content_block_icon_blocks",
  "content_block_media_blocks",
  "content_block_action_blocks",
  "content_block_children",
  "profile_icon_blocks",
  "experience_icon_blocks",
  "site_chunks",
  "search_index_jobs",
];

async function withDatabase(
  verify: (sql: Client, prisma: PrismaClient, url: URL) => Promise<void>,
) {
  assert.ok(
    target,
    "Set PORTFOLIO_TEST_DATABASE_URL to a disposable PostgreSQL server with pgvector.",
  );
  const admin = new Client({ connectionString: target });

  const name = `m24_test_${randomUUID().replaceAll("-", "")}`;

  const url = new URL(target);

  url.pathname = `/${name}`;
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
    const sql = new Client({ connectionString: url.href });

    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href }) });

    try {
      await sql.connect();
      await verify(sql, prisma, url);
    } finally {
      await prisma.$disconnect();
      await sql.end();
      await admin.query(`DROP DATABASE "${name}"`);
    }
  } finally {
    await admin.end();
  }
}

async function visibleLegacyTables(sql: Client) {
  const result = await sql.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1)",
    [legacyTables],
  );

  return result.rows.map(({ tablename }) => tablename).sort();
}

async function migrationsInOrder() {
  return (await readdir("prisma/migrations")).filter((entry) => /^\d+_/.test(entry)).sort();
}

test(
  "M24 rehearses the additive release, safe seed and cleanup on a pre-M24 database",
  { timeout: 120_000 },
  async () => {
    await withDatabase(async (sql, prisma, url) => {
      const migrations = await migrationsInOrder();

      for (const migration of migrations.filter((entry) => entry < additive)) {
        await applyPrismaMigration(sql, migration);
      }

      assert.deepEqual(await visibleLegacyTables(sql), [...legacyTables].sort());
      await sql.query(`
      INSERT INTO profiles (name, title, positioning, email, linkedin_url, github_url)
      VALUES ('Legacy fixture', 'Fixture', 'Fixture', 'fixture@example.test', 'https://example.test', 'https://example.test');
      INSERT INTO meetings (google_event_id, name, email, timezone, reason, starts_at, ends_at, status, raw_provider_payload)
      VALUES ('m24-preserved', 'Fixture', 'fixture@example.test', 'UTC', 'Fixture', NOW(), NOW(), 'confirmed', '{}');
      INSERT INTO rate_limits (scope, key_hash, rule_id, count, reset_at)
      VALUES ('test', 'm24-preserved', 'fixture', 1, NOW());
      INSERT INTO workflow_instances (id, workflow_id, workflow_version, state, origin_channel)
      VALUES ('a0000000-0000-4000-8000-000000000024', 'audit', 1, '{}', 'test'),
             ('c0000000-0000-4000-8000-000000000024', 'contact', 1, '{}', 'test');
      INSERT INTO audit_requests (workflow_instance_id, focus, current_process, friction, desired_outcome, name, email)
      VALUES ('a0000000-0000-4000-8000-000000000024', 'focus', 'process', 'friction', 'outcome', 'Fixture', 'fixture@example.test');
      INSERT INTO contact_requests (workflow_instance_id, name, email, message)
      VALUES ('c0000000-0000-4000-8000-000000000024', 'Fixture', 'fixture@example.test', 'message');
      INSERT INTO site_chunks (id, source_type, source_id, chunk_index, title, category, url, content, keywords, embedding)
      VALUES ('retired-fixture', 'project', 'm24', 0, 'Fixture', 'fixture', '/work', 'Fixture', '{}',
        array_fill(0::real, ARRAY[1536])::vector);
    `);
      const oldQueue = (await sql.query("SELECT * FROM search_index_jobs")).rows;

      await applyPrismaMigration(sql, additive);
      await assert.rejects(applyPrismaMigration(sql, cleanup), /Apply the portfolio seed/);
      await sql.query("ROLLBACK");
      assert.deepEqual(await visibleLegacyTables(sql), [...legacyTables].sort());
      const seeder = new PortfolioSeedService(new PrismaPortfolioSeedRepository(prisma));

      const publicSite = new PublicPortfolioService(new PrismaPublicPortfolioRepository(prisma));

      const count = async () => await prisma.project.count();

      await assert.rejects(publicSite.getHomepage(), /Portfolio content is incomplete/);
      const preview = await seeder.run(baseline, false);

      assert.equal(preview.length, 35);
      assert.ok(preview.every(({ change }) => change === "insert"));
      assert.equal(await count(), 0);
      assert.deepEqual(await seeder.run(baseline, true), preview);
      assert.equal(await count(), 9);
      assert.ok((await seeder.run(baseline, true)).every(({ change }) => change === "skip"));
      assert.deepEqual((await sql.query("SELECT * FROM search_index_jobs")).rows, oldQueue);

      const home = await publicSite.getHomepage();

      assert.equal(home.profile.name, "Freeman Madudili");
      assert.equal(home.featured.length, 3);
      assert.equal(home.experience.length, 4);
      assert.equal(home.services.length, 2);
      assert.deepEqual(
        (await publicSite.findProject("portfolio-assistant"))?.services.map(({ key }) => key),
        ["product-development", "automation-ai"],
      );
      assert.equal(await publicSite.findProject("missing"), null);

      const oneEdit = {
        ...noEdits,
        caseStudies: [{ ...baseline.caseStudies[0], outcome: "An isolated outcome edit." }],
      };

      const planned = await seeder.run(oneEdit, false);

      assert.deepEqual(
        planned.filter(({ change }) => change !== "skip"),
        [{ record: "caseStudies", key: "jpscents", change: "update" }],
      );
      assert.notEqual(
        (await publicSite.findProject("jpscents"))?.study?.outcome,
        oneEdit.caseStudies[0].outcome,
      );
      await seeder.run(oneEdit, true);
      assert.equal(
        (await publicSite.findProject("jpscents"))?.study?.outcome,
        oneEdit.caseStudies[0].outcome,
      );
      assert.equal(await count(), 9);
      assert.equal(await prisma.projectCaseStudy.count(), 9);

      const assistant = baseline.projects[3];

      const onlyFirstLink = {
        ...noEdits,
        projects: [{ ...assistant, serviceKeys: ["product-development"] }],
      };

      await seeder.run(onlyFirstLink, true);
      assert.equal((await publicSite.findProject(assistant.slug))?.services.length, 2);
      await assert.rejects(
        seeder.run(
          { ...noEdits, projects: [{ ...assistant, serviceKeys: ["automation-ai"] }] },
          true,
        ),
        /portfolio-assistant position 1 is occupied/,
      );
      await assert.rejects(
        seeder.run({ ...noEdits, projects: [{ ...assistant, serviceKeys: ["unknown"] }] }, false),
        /unknown service/,
      );
      await assert.rejects(
        seeder.run(
          { ...noEdits, caseStudies: [{ ...baseline.caseStudies[0], projectSlug: "missing" }] },
          false,
        ),
        /unknown project/,
      );

      await seeder.run(
        {
          ...noEdits,
          projects: [{ ...assistant, serviceKeys: [...assistant.serviceKeys].reverse() }],
        },
        true,
      );
      assert.deepEqual(
        (await publicSite.findProject(assistant.slug))?.services.map(({ key }) => key),
        ["automation-ai", "product-development"],
      );

      const expected = {
        DATABASE_URL: url.href,
        PORTFOLIO_SEED_ENVIRONMENT: "development",
        PORTFOLIO_SEED_DATABASE: `${url.hostname}:${url.port || "5432"}${url.pathname}`,
        PORTFOLIO_SEED_USER: decodeURIComponent(url.username),
      };

      assert.throws(
        () =>
          verifyPortfolioTarget("development", expected, {
            DATABASE_URL: new URL("/different_database", url).href,
          }),
        /Inherited/,
      );

      await sql.query(
        "ALTER TABLE portfolio_project_case_studies ADD CHECK (outcome <> 'fixture rejects')",
      );
      await assert.rejects(
        seeder.run(
          {
            ...noEdits,
            profile: { ...baseline.profile, name: "Must roll back" },
            caseStudies: [{ ...baseline.caseStudies[0], outcome: "fixture rejects" }],
          },
          true,
        ),
      );
      assert.equal((await publicSite.getHomepage()).profile.name, "Freeman Madudili");
      assert.equal(
        (await publicSite.findProject("jpscents"))?.study?.outcome,
        oneEdit.caseStudies[0].outcome,
      );

      for (const table of [
        "portfolio_profiles",
        "portfolio_projects",
        "portfolio_project_case_studies",
        "portfolio_experiences",
        "portfolio_services",
        "portfolio_project_services",
      ]) {
        for (const role of ["anon", "authenticated", "service_role"]) {
          const { rows } = await sql.query<{ exposed: boolean }>(
            "SELECT has_table_privilege($1, $2, 'SELECT') AS exposed",
            [role, table],
          );

          assert.equal(rows[0].exposed, false, `${role} can read ${table}`);
        }
      }

      assert.deepEqual(await visibleLegacyTables(sql), [...legacyTables].sort());
      assert.equal((await sql.query("SELECT name FROM profiles")).rows[0].name, "Legacy fixture");
      assert.equal((await sql.query("SELECT id FROM site_chunks")).rows[0].id, "retired-fixture");
      const preserved = new Map<string, unknown>();

      for (const table of [
        "meetings",
        "rate_limits",
        "workflow_instances",
        "audit_requests",
        "contact_requests",
      ]) {
        const { rows } = await sql.query(`SELECT * FROM ${table} ORDER BY 1`);

        assert.ok(rows.length, `Expected a preserved ${table} fixture.`);
        preserved.set(table, rows);
      }

      await applyPrismaMigration(sql, cleanup);
      assert.deepEqual(await visibleLegacyTables(sql), []);
      const retiredFunctions = await sql.query(`
        SELECT proname FROM pg_proc
        WHERE pronamespace = 'public'::regnamespace
          AND proname IN ('match_site_chunks', 'enqueue_search_index_job', 'enqueue_portfolio_search_index_job')
      `);

      assert.deepEqual(retiredFunctions.rows, []);
      for (const [table, before] of preserved) {
        assert.deepEqual((await sql.query(`SELECT * FROM ${table} ORDER BY 1`)).rows, before);
      }

      assert.equal(
        (await publicSite.findProject("jpscents"))?.study?.outcome,
        oneEdit.caseStudies[0].outcome,
      );
      assert.equal(await count(), 9);
    });
  },
);

test(
  "a fresh database can be migrated and seeded before cleanup",
  { timeout: 120_000 },
  async () => {
    await withDatabase(async (sql, prisma) => {
      for (const migration of (await migrationsInOrder()).filter((entry) => entry < cleanup)) {
        await applyPrismaMigration(sql, migration);
      }

      const seed = new PortfolioSeedService(new PrismaPortfolioSeedRepository(prisma));

      assert.equal(
        (await seed.run(baseline, true)).filter(({ change }) => change === "insert").length,
        35,
      );
      await applyPrismaMigration(sql, cleanup);
      assert.deepEqual(await visibleLegacyTables(sql), []);
      assert.equal(await prisma.project.count(), 9);
    });
  },
);
