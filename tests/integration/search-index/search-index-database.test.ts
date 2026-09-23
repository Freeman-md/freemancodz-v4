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
import type { PortfolioStorage } from "@/modules/portfolio/types";
import type { SearchIndexJob } from "@/modules/search-index/types";
import type { EmbeddedSiteChunk } from "@/modules/search-index/types";
import { SearchIndexJobRepository } from "@/modules/search-index/repositories/search-index-job.repository";
import { SiteChunkRepository } from "@/modules/search-index/repositories/site-chunk.repository";

const adminConnectionUrl = process.env.PORTFOLIO_TEST_DATABASE_URL;

const MILESTONE_17_MIGRATION = "20260818090000_database_driven_search_indexing";

const CONTENT_ANCHOR_MIGRATION = "20260820090000_rename_portfolio_content_anchors";

const CONTENT_BLOCK_ID = "10000000-0000-0000-0000-000000000001";

const ICON_BLOCK_ID = "20000000-0000-0000-0000-000000000001";

const PROJECT_ID = "30000000-0000-0000-0000-000000000001";

const EXPERIENCE_ID = "40000000-0000-0000-0000-000000000001";

const EXPECTED_TRIGGER_TABLES = [
  "action_blocks",
  "content_block_action_blocks",
  "content_block_children",
  "content_block_icon_blocks",
  "content_block_media_blocks",
  "content_blocks",
  "experience_icon_blocks",
  "experiences",
  "icon_blocks",
  "media_blocks",
  "profile_icon_blocks",
  "profiles",
  "projects",
];

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

async function readJob(database: Client): Promise<SearchIndexJob> {
  const result = await database.query<SearchIndexJob>(`
    SELECT
      job_key AS "jobKey",
      status,
      rerun_requested AS "rerunRequested",
      attempts,
      available_at AS "availableAt",
      requested_at AS "requestedAt",
      claimed_at AS "claimedAt",
      processed_at AS "processedAt",
      last_error AS "lastError"
    FROM public.search_index_jobs
    WHERE job_key = 'portfolio'
  `);

  assert.equal(result.rowCount, 1);

  return result.rows[0]!;
}

async function setJob(
  database: Client,
  state: {
    status: SearchIndexJob["status"];
    attempts?: number;
    rerunRequested?: boolean;
    claimedAt?: Date | null;
    lastError?: string | null;
  },
) {
  const isProcessing = state.status === "processing";

  const isTerminal = state.status === "completed" || state.status === "failed";

  await database.query(
    `
      UPDATE public.search_index_jobs
      SET
        status = $1,
        rerun_requested = $2,
        attempts = $3,
        available_at = statement_timestamp(),
        requested_at = statement_timestamp(),
        claimed_at = $4,
        processed_at = CASE WHEN $5::boolean THEN statement_timestamp() ELSE NULL END,
        last_error = $6
      WHERE job_key = 'portfolio'
    `,
    [
      state.status,
      state.rerunRequested ?? false,
      state.attempts ?? 0,
      isProcessing ? (state.claimedAt ?? new Date()) : null,
      isTerminal,
      state.lastError ?? null,
    ],
  );
}

function embeddedChunk(id: string, overrides: Partial<EmbeddedSiteChunk> = {}): EmbeddedSiteChunk {
  return {
    id,
    sourceType: "profile",
    sourceId: "global",
    chunkIndex: 0,
    title: "Profile",
    category: "Profile",
    url: "/",
    keywords: ["portfolio"],
    content: "Current portfolio profile.",
    embeddingInput: "Current portfolio profile.",
    contentHash: `hash-${id}`,
    embedding: Array<number>(1_536).fill(0.01),
    embeddingModel: "test-embedding-model",
    embeddedAt: new Date("2026-08-18T09:00:00.000Z"),
    ...overrides,
  };
}

test(
  "Milestone 17 migrates and runs the singleton indexing state machine on disposable PostgreSQL",
  { skip: !adminConnectionUrl, timeout: 180_000 },
  async (context) => {
    const databaseName = `milestone17_test_${randomUUID().replaceAll("-", "")}`;

    const adminUrl = new URL(adminConnectionUrl!);

    const databaseUrl = new URL(adminConnectionUrl!);

    databaseUrl.pathname = `/${databaseName}`;

    const admin = new Client({ connectionString: adminUrl.toString() });

    let database: Client | undefined;

    let prisma: PrismaClient | undefined;

    let concurrentPrisma: PrismaClient | undefined;

    await admin.connect();
    await admin.query(`CREATE DATABASE "${databaseName}"`);

    try {
      database = new Client({ connectionString: databaseUrl.toString() });
      await database.connect();

      const migrationDirectories = (await readdir(resolve(process.cwd(), "prisma/migrations")))
        .filter((directory) => /^\d+_/.test(directory))
        .sort();

      const milestoneMigrationIndex = migrationDirectories.indexOf(MILESTONE_17_MIGRATION);

      assert.notEqual(milestoneMigrationIndex, -1, "Expected the Milestone 17 migration.");

      for (const directory of migrationDirectories.slice(0, milestoneMigrationIndex)) {
        await applyMigration(database, directory);
      }

      await database.query(`
        INSERT INTO public.meetings (
          google_event_id, name, email, timezone, reason, starts_at, ends_at, status,
          raw_provider_payload
        ) VALUES (
          'protected-event', 'Protected', 'protected@example.test', 'Europe/London', 'proof',
          NOW(), NOW() + INTERVAL '30 minutes', 'confirmed', '{}'
        );

        INSERT INTO public.site_chunks (
          id, source_type, source_id, chunk_index, title, category, url, content, keywords, embedding
        ) VALUES (
          'protected-chunk', 'project', '${PROJECT_ID}', 0,
          'Protected', 'proof', '/work', 'protected', ARRAY['protected'],
          array_fill(0.01::real, ARRAY[1536])::vector
        );

        INSERT INTO public.profiles (
          id, name, title, positioning, email, linkedin_url, github_url
        ) VALUES (
          'global', 'Protected profile', 'Engineer', 'Positioning', 'profile@example.test',
          'https://example.test/linkedin', 'https://example.test/github'
        );

        INSERT INTO public.content_blocks (id, title, url, "order")
        VALUES (
          '${CONTENT_BLOCK_ID}', 'Protected content', '/#home-improve-heading', 1
        );

        INSERT INTO public.icon_blocks (id, label)
        VALUES ('${ICON_BLOCK_ID}', 'Protected icon');

        INSERT INTO public.media_blocks (id, type, source, alt_text)
        VALUES ('${ICON_BLOCK_ID}', 'image', '/images/protected.png', 'Protected media');

        INSERT INTO public.experiences (id, title, copy, "order")
        VALUES ('${EXPERIENCE_ID}', 'Protected experience', 'Protected copy', 1);

        INSERT INTO public.projects (
          id, slug, title, category, problem, solution, featured, "order"
        ) VALUES (
          '${PROJECT_ID}', 'protected-project', 'Protected project', 'Proof',
          'Problem', 'Solution', false, 1
        );

        INSERT INTO public.search_index_jobs (
          operation, source_type, source_id, status, attempts, available_at
        ) VALUES (
          'upsert', 'projects', '${PROJECT_ID}', 'pending', 2, NOW()
        );
      `);

      await applyMigration(database, MILESTONE_17_MIGRATION);

      await applyMigration(database, CONTENT_ANCHOR_MIGRATION);

      prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: databaseUrl.toString() }),
      });
      concurrentPrisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: databaseUrl.toString() }),
      });

      const jobs = new SearchIndexJobRepository(prisma);

      const concurrentJobs = new SearchIndexJobRepository(concurrentPrisma);

      const chunks = new SiteChunkRepository(prisma);

      await context.test(
        "applies the full chain and preserves protected data and retrieval",
        async () => {
          const result = await database!.query<{
            meetings: string;
            chunks: string;
            profiles: string;
            projects: string;
            experiences: string;
            match_function: boolean;
            legacy_function: boolean;
            singleton_function: boolean;
          }>(`
          SELECT
            (SELECT COUNT(*) FROM public.meetings) AS meetings,
            (SELECT COUNT(*) FROM public.site_chunks) AS chunks,
            (SELECT COUNT(*) FROM public.profiles) AS profiles,
            (SELECT COUNT(*) FROM public.projects) AS projects,
            (SELECT COUNT(*) FROM public.experiences) AS experiences,
            to_regprocedure('public.match_site_chunks(vector,integer,double precision)') IS NOT NULL
              AS match_function,
            to_regprocedure('public.enqueue_search_index_job()') IS NOT NULL AS legacy_function,
            to_regprocedure('public.enqueue_portfolio_search_index_job()') IS NOT NULL
              AS singleton_function
        `);

          assert.deepEqual(result.rows[0], {
            meetings: "1",
            chunks: "1",
            profiles: "1",
            projects: "1",
            experiences: "1",
            match_function: true,
            legacy_function: false,
            singleton_function: true,
          });
          const initialJob = await readJob(database!);

          assert.equal(initialJob.jobKey, "portfolio");
          assert.equal(initialJob.status, "pending");
          assert.equal(initialJob.rerunRequested, false);
          assert.equal(initialJob.attempts, 0);
          assert.equal(initialJob.claimedAt, null);
          assert.equal(initialJob.processedAt, null);
          assert.equal(initialJob.lastError, null);

          const migratedContent = await database!.query<{ url: string }>(
            `SELECT url FROM public.content_blocks WHERE id = $1`,
            [CONTENT_BLOCK_ID],
          );

          assert.equal(migratedContent.rows[0]?.url, "/#home-improve");
        },
      );

      await context.test(
        "enforces singleton constraints and least-privilege queue access",
        async () => {
          await assert.rejects(
            database!.query(
              `UPDATE public.search_index_jobs SET job_key = 'other' WHERE job_key = 'portfolio'`,
            ),
            hasPostgresCode("23514"),
          );
          await assert.rejects(
            database!.query(
              `UPDATE public.search_index_jobs SET status = 'unknown' WHERE job_key = 'portfolio'`,
            ),
            hasPostgresCode("23514"),
          );
          await assert.rejects(
            database!.query(
              `UPDATE public.search_index_jobs SET attempts = -1 WHERE job_key = 'portfolio'`,
            ),
            hasPostgresCode("23514"),
          );

          const result = await database!.query<{
            rls_enabled: boolean;
            anon_table_access: boolean;
            authenticated_table_access: boolean;
            anon_function_access: boolean;
            authenticated_function_access: boolean;
            security_definer: boolean;
            queue_indexes: string;
          }>(`
          SELECT
            table_class.relrowsecurity AS rls_enabled,
            (
              has_table_privilege('anon', 'public.search_index_jobs', 'SELECT')
              OR has_table_privilege('anon', 'public.search_index_jobs', 'INSERT')
              OR has_table_privilege('anon', 'public.search_index_jobs', 'UPDATE')
              OR has_table_privilege('anon', 'public.search_index_jobs', 'DELETE')
            ) AS anon_table_access,
            (
              has_table_privilege('authenticated', 'public.search_index_jobs', 'SELECT')
              OR has_table_privilege('authenticated', 'public.search_index_jobs', 'INSERT')
              OR has_table_privilege('authenticated', 'public.search_index_jobs', 'UPDATE')
              OR has_table_privilege('authenticated', 'public.search_index_jobs', 'DELETE')
            ) AS authenticated_table_access,
            has_function_privilege('anon', 'public.enqueue_portfolio_search_index_job()',
              'EXECUTE') AS anon_function_access,
            has_function_privilege('authenticated',
              'public.enqueue_portfolio_search_index_job()', 'EXECUTE')
              AS authenticated_function_access,
            trigger_function.prosecdef AS security_definer,
            (
              SELECT string_agg(indexname, ',' ORDER BY indexname)
              FROM pg_indexes
              WHERE schemaname = 'public' AND tablename = 'search_index_jobs'
            ) AS queue_indexes
          FROM pg_class AS table_class
          JOIN pg_namespace AS table_namespace ON table_namespace.oid = table_class.relnamespace
          CROSS JOIN pg_proc AS trigger_function
          JOIN pg_namespace AS function_namespace
            ON function_namespace.oid = trigger_function.pronamespace
          WHERE table_namespace.nspname = 'public'
            AND table_class.relname = 'search_index_jobs'
            AND function_namespace.nspname = 'public'
            AND trigger_function.proname = 'enqueue_portfolio_search_index_job'
        `);

          assert.deepEqual(result.rows[0], {
            rls_enabled: true,
            anon_table_access: false,
            authenticated_table_access: false,
            anon_function_access: false,
            authenticated_function_access: false,
            security_definer: false,
            queue_indexes: "search_index_jobs_pkey",
          });
        },
      );

      await context.test(
        "installs exactly thirteen statement-level portfolio triggers",
        async () => {
          const result = await database!.query<{
            table_name: string;
            definition: string;
          }>(`
          SELECT
            target.relname AS table_name,
            pg_get_triggerdef(trigger.oid) AS definition
          FROM pg_trigger AS trigger
          JOIN pg_class AS target ON target.oid = trigger.tgrelid
          JOIN pg_proc AS function ON function.oid = trigger.tgfoid
          JOIN pg_namespace AS namespace ON namespace.oid = function.pronamespace
          WHERE NOT trigger.tgisinternal
            AND namespace.nspname = 'public'
            AND function.proname = 'enqueue_portfolio_search_index_job'
          ORDER BY target.relname
        `);

          assert.deepEqual(
            result.rows.map(({ table_name }) => table_name),
            EXPECTED_TRIGGER_TABLES,
          );
          for (const { definition } of result.rows) {
            assert.match(definition, /AFTER INSERT OR DELETE OR UPDATE/);
            assert.match(definition, /FOR EACH STATEMENT/);
          }
        },
      );

      await context.test(
        "committed mutations enqueue, coalesce, and rolled-back writes do not",
        async () => {
          await setJob(database!, { status: "completed", attempts: 2, lastError: "old" });
          const transient = await database!.query<{ id: string }>(
            `INSERT INTO public.icon_blocks (label) VALUES ('Transient') RETURNING id`,
          );

          let job = await readJob(database!);

          assert.equal(job.status, "pending");
          assert.equal(job.attempts, 0);
          assert.equal(job.lastError, null);

          await database!.query(`INSERT INTO public.icon_blocks (label) VALUES ('Coalesced')`);
          assert.equal(
            Number(
              (
                await database!.query<{ count: string }>(
                  `SELECT COUNT(*) AS count FROM public.search_index_jobs`,
                )
              ).rows[0]!.count,
            ),
            1,
          );

          await setJob(database!, { status: "completed" });
          await database!.query(`DELETE FROM public.icon_blocks WHERE id = $1`, [
            transient.rows[0]!.id,
          ]);
          assert.equal((await readJob(database!)).status, "pending");

          await setJob(database!, { status: "completed" });
          await database!.query("BEGIN");
          try {
            await database!.query(
              `UPDATE public.profiles SET positioning = 'Rolled back' WHERE id = 'global'`,
            );
            assert.equal((await readJob(database!)).status, "pending");
          } finally {
            await database!.query("ROLLBACK");
          }

          job = await readJob(database!);
          assert.equal(job.status, "completed");
        },
      );

      await context.test(
        "base, subtype, and ordered-junction writes all enqueue work",
        async () => {
          await setJob(database!, { status: "completed" });
          await database!.query(
            `UPDATE public.profiles SET positioning = 'Updated profile' WHERE id = 'global'`,
          );
          assert.equal((await readJob(database!)).status, "pending");

          await setJob(database!, { status: "completed" });
          await database!.query(
            `UPDATE public.media_blocks SET alt_text = 'Updated media' WHERE id = $1`,
            [ICON_BLOCK_ID],
          );
          assert.equal((await readJob(database!)).status, "pending");

          await setJob(database!, { status: "completed" });
          await database!.query(
            `
            INSERT INTO public.content_block_media_blocks (
              content_block_id, media_block_id, "order"
            ) VALUES ($1, $2, 1)
          `,
            [CONTENT_BLOCK_ID, ICON_BLOCK_ID],
          );
          assert.equal((await readJob(database!)).status, "pending");
        },
      );

      await context.test(
        "preserves pending retry state but resets terminal rebuild state",
        async () => {
          await setJob(database!, {
            status: "pending",
            attempts: 2,
            lastError: "safe prior failure",
          });
          await database!.query(
            `UPDATE public.profiles SET positioning = 'Pending trigger request' WHERE id = 'global'`,
          );
          let job = await readJob(database!);

          assert.equal(job.status, "pending");
          assert.equal(job.attempts, 2);
          assert.equal(job.lastError, "safe prior failure");

          await jobs.requestRebuild();
          job = await readJob(database!);

          assert.equal(job.status, "pending");
          assert.equal(job.attempts, 2);
          assert.equal(job.lastError, "safe prior failure");

          await setJob(database!, { status: "failed", attempts: 3, lastError: "terminal" });
          await jobs.requestRebuild();
          job = await readJob(database!);

          assert.equal(job.status, "pending");
          assert.equal(job.attempts, 0);
          assert.equal(job.lastError, null);
          assert.equal(job.processedAt, null);
        },
      );

      await context.test(
        "allows only one concurrent claim and rejects stale settlement tokens",
        async () => {
          await setJob(database!, { status: "pending" });

          const claims = await Promise.all([jobs.claim(), concurrentJobs.claim()]);

          const claimedJobs = claims.flatMap(({ job }) => (job ? [job] : []));

          assert.equal(claimedJobs.length, 1);
          assert.equal(claimedJobs[0]!.attempts, 1);
          assert.equal(await jobs.complete(new Date(0)), null);

          const completed = await jobs.complete(claimedJobs[0]!.claimedAt);

          assert.equal(completed?.status, "completed");
        },
      );

      await context.test("reruns newer work after completion or failure", async () => {
        await setJob(database!, { status: "pending" });
        const completionClaim = (await jobs.claim()).job;

        assert.ok(completionClaim);
        await database!.query(
          `UPDATE public.profiles SET positioning = 'Newer completion work' WHERE id = 'global'`,
        );
        assert.equal((await readJob(database!)).rerunRequested, true);

        const completion = await jobs.complete(completionClaim.claimedAt);

        assert.equal(completion?.status, "pending");
        assert.equal(completion?.attempts, 0);

        const failureClaim = (await jobs.claim()).job;

        assert.ok(failureClaim);
        await database!.query(
          `UPDATE public.profiles SET positioning = 'Newer failure work' WHERE id = 'global'`,
        );

        const failure = await jobs.fail(failureClaim.claimedAt, "Safe older failure");

        assert.equal(failure?.status, "pending");
        assert.equal(failure?.attempts, 0);
        assert.equal(failure?.lastError, null);
      });

      await context.test(
        "retries immediately three times, then recovers terminal failure",
        async () => {
          await setJob(database!, { status: "pending" });
          const claimTokens = new Set<number>();

          for (let attempt = 1; attempt <= 3; attempt += 1) {
            const claim = (await jobs.claim()).job;

            assert.ok(claim);
            assert.equal(claim.attempts, attempt);
            claimTokens.add(claim.claimedAt.getTime());

            const failed = await jobs.fail(claim.claimedAt, `Safe failure ${attempt}`);

            assert.equal(failed?.status, attempt < 3 ? "pending" : "failed");
            assert.equal(failed?.lastError, `Safe failure ${attempt}`);
          }

          assert.equal(claimTokens.size, 3);
          assert.equal((await jobs.claim()).job, null);

          await database!.query(
            `UPDATE public.profiles SET positioning = 'Recover terminal failure' WHERE id = 'global'`,
          );
          const recovered = await readJob(database!);

          assert.equal(recovered.status, "pending");
          assert.equal(recovered.attempts, 0);
          assert.equal(recovered.lastError, null);
        },
      );

      await context.test("bounds stale recovery while preserving a newer request", async () => {
        const staleClaimedAt = new Date(Date.now() - 11 * 60_000);

        await setJob(database!, {
          status: "processing",
          attempts: 2,
          claimedAt: staleClaimedAt,
        });
        let recovery = await jobs.claim();

        assert.equal(recovery.staleJobRecovered, true);
        assert.equal(recovery.job?.attempts, 3);

        await database!.query(
          `
            UPDATE public.search_index_jobs
            SET claimed_at = statement_timestamp() - INTERVAL '11 minutes'
            WHERE job_key = 'portfolio'
          `,
        );
        recovery = await jobs.claim();

        assert.equal(recovery.staleJobRecovered, true);
        assert.equal(recovery.job, null);
        assert.equal((await readJob(database!)).status, "failed");

        await setJob(database!, {
          status: "processing",
          attempts: 3,
          rerunRequested: true,
          claimedAt: staleClaimedAt,
        });
        recovery = await jobs.claim();

        assert.equal(recovery.staleJobRecovered, true);
        assert.equal(recovery.job?.attempts, 1);
        assert.ok(recovery.job);
        await jobs.complete(recovery.job.claimedAt);
      });

      await context.test(
        "atomically replaces large batched snapshots, preserves values, and rolls back failures",
        async () => {
          const current = embeddedChunk("current-chunk");

          await setJob(database!, { status: "pending" });
          const claim = (await jobs.claim()).job;

          assert.ok(claim);

          await chunks.replacePortfolioSnapshot([current], claim.claimedAt);
          assert.deepEqual(
            (await database!.query<{ id: string }>(`SELECT id FROM public.site_chunks ORDER BY id`))
              .rows,
            [{ id: "current-chunk" }],
          );

          const snapshot = Array.from({ length: 105 }, (_, index) => {
            const secondBatch = index >= 100;

            return embeddedChunk(`batch-chunk-${index}`, {
              sourceType: "project",
              sourceId: `batch-project-${index}`,
              chunkIndex: index,
              title: `Batch title ${index}`,
              category: `Batch category ${index}`,
              url: `/work/batch-project-${index}`,
              keywords: [`batch-${index}`, "portfolio"],
              content: `Batch content ${index}`,
              embeddingInput: `Batch embedding input ${index}`,
              contentHash: `batch-hash-${index}`,
              embedding: Array<number>(1_536).fill(secondBatch ? 0.02 : 0.01),
              embeddingModel: secondBatch ? "batch-model-two" : "batch-model-one",
              embeddedAt: new Date(Date.UTC(2026, 7, 18, 9, 0, index)),
            });
          });

          await chunks.replacePortfolioSnapshot(snapshot, claim.claimedAt);

          const storedCount = await database!.query<{ count: string }>(
            `SELECT COUNT(*) AS count FROM public.site_chunks`,
          );

          assert.equal(storedCount.rows[0]!.count, "105");

          const samples = await database!.query<{
            id: string;
            sourceType: string;
            sourceId: string;
            chunkIndex: number;
            title: string;
            category: string;
            url: string;
            content: string;
            keywords: string[];
            contentHash: string;
            embeddingModel: string;
            embeddedAt: string;
            embeddingDimensions: number;
            embeddingText: string;
          }>(
            `
              SELECT
                id,
                source_type AS "sourceType",
                source_id AS "sourceId",
                chunk_index AS "chunkIndex",
                title,
                category,
                url,
                content,
                keywords,
                content_hash AS "contentHash",
                embedding_model AS "embeddingModel",
                to_char(embedded_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS') AS "embeddedAt",
                vector_dims(embedding) AS "embeddingDimensions",
                embedding::text AS "embeddingText"
              FROM public.site_chunks
              WHERE id = ANY($1::text[])
              ORDER BY chunk_index
            `,
            [["batch-chunk-0", "batch-chunk-99", "batch-chunk-104"]],
          );

          assert.equal(samples.rows.length, 3);

          for (const [sampleIndex, expectedIndex] of [0, 99, 104].entries()) {
            const sample = samples.rows[sampleIndex]!;

            const { embeddingText, ...storedValues } = sample;

            const secondBatch = expectedIndex >= 100;

            assert.deepEqual(storedValues, {
              id: `batch-chunk-${expectedIndex}`,
              sourceType: "project",
              sourceId: `batch-project-${expectedIndex}`,
              chunkIndex: expectedIndex,
              title: `Batch title ${expectedIndex}`,
              category: `Batch category ${expectedIndex}`,
              url: `/work/batch-project-${expectedIndex}`,
              content: `Batch content ${expectedIndex}`,
              keywords: [`batch-${expectedIndex}`, "portfolio"],
              contentHash: `batch-hash-${expectedIndex}`,
              embeddingModel: secondBatch ? "batch-model-two" : "batch-model-one",
              embeddedAt: new Date(Date.UTC(2026, 7, 18, 9, 0, expectedIndex))
                .toISOString()
                .slice(0, 23),
              embeddingDimensions: 1_536,
            });
            assert.match(embeddingText, secondBatch ? /^\[0\.02,/ : /^\[0\.01,/);
          }

          const failedSnapshot = Array.from({ length: 105 }, (_, index) =>
            embeddedChunk(`failed-batch-chunk-${index}`, {
              sourceType: "experience",
              sourceId: index === 104 ? "failed-source-0" : `failed-source-${index}`,
              chunkIndex: 0,
            }),
          );

          await assert.rejects(chunks.replacePortfolioSnapshot(failedSnapshot, claim.claimedAt));
          assert.deepEqual(
            (await database!.query<{ id: string }>(`SELECT id FROM public.site_chunks ORDER BY id`))
              .rows,
            snapshot
              .map(({ id }) => ({ id }))
              .sort((left, right) => left.id.localeCompare(right.id)),
          );

          await assert.rejects(
            chunks.replacePortfolioSnapshot([], claim.claimedAt),
            /at least one chunk/,
          );
          await assert.rejects(
            chunks.replacePortfolioSnapshot(
              [embeddedChunk("invalid-vector", { embedding: [Number.NaN] })],
              claim.claimedAt,
            ),
            /invalid embedding/,
          );
          assert.deepEqual(
            (await database!.query<{ id: string }>(`SELECT id FROM public.site_chunks ORDER BY id`))
              .rows,
            snapshot
              .map(({ id }) => ({ id }))
              .sort((left, right) => left.id.localeCompare(right.id)),
          );

          await jobs.complete(claim.claimedAt);
        },
      );

      await context.test(
        "rejects a stale worker before it can overwrite newer chunks",
        async () => {
          const staleClaimedAt = new Date(Date.now() - 11 * 60_000);

          await setJob(database!, {
            status: "processing",
            attempts: 1,
            claimedAt: staleClaimedAt,
          });

          const replacementClaim = (await jobs.claim()).job;

          assert.ok(replacementClaim);
          await chunks.replacePortfolioSnapshot(
            [embeddedChunk("newer-current-chunk")],
            replacementClaim.claimedAt,
          );
          await jobs.complete(replacementClaim.claimedAt);

          await assert.rejects(
            chunks.replacePortfolioSnapshot([embeddedChunk("stale-worker-chunk")], staleClaimedAt),
            /claim is no longer current/,
          );
          assert.deepEqual(
            (await database!.query<{ id: string }>(`SELECT id FROM public.site_chunks ORDER BY id`))
              .rows,
            [{ id: "newer-current-chunk" }],
          );
        },
      );

      await context.test(
        "portfolio bootstrap requests indexing only through database triggers",
        async () => {
          const storage: PortfolioStorage = {
            ensurePublicBucket: async () => undefined,
            getPublicUrl: (objectPath) => `https://portfolio.test/${objectPath}`,
          };

          await resetPortfolio(prisma!);
          await setJob(database!, { status: "completed" });
          await seedPortfolio(prisma!, storage);

          assert.deepEqual(await verifyPortfolio(prisma!), {
            profiles: 1,
            projects: 6,
            experiences: 4,
            topLevelBlocks: 22,
          });
          assert.equal((await readJob(database!)).status, "pending");
        },
      );
    } finally {
      await concurrentPrisma?.$disconnect();
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
