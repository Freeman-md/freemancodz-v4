import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const migrationPath = resolve(
  process.cwd(),
  "prisma/migrations/20260720090000_add_search_index_jobs/migration.sql",
);

async function readMigration(): Promise<string> {
  return readFile(migrationPath, "utf8");
}

test("search index job migration creates the coalescing pending-job index", async () => {
  const migration = await readMigration();

  assert.match(migration, /CREATE TABLE "search_index_jobs"/);
  assert.match(
    migration,
    /CREATE UNIQUE INDEX "search_index_jobs_pending_unique"[\s\S]*WHERE "status" = 'pending'/,
  );
  assert.match(migration, /"claimed_at" TIMESTAMPTZ\(6\)/);
});

test("search index job migration atomically coalesces source trigger events", async () => {
  const migration = await readMigration();

  assert.match(migration, /ON CONFLICT \(source_type, source_id\) WHERE status = 'pending'/);
  assert.match(migration, /operation = EXCLUDED\.operation/);
  assert.match(migration, /available_at = NOW\(\)/);
  assert.match(migration, /last_error = NULL/);
});

test("search index job migration attaches upsert and delete triggers to every source table", async () => {
  const migration = await readMigration();

  for (const sourceType of [
    "content_blocks",
    "projects",
    "services",
    "principles",
    "experiences",
  ]) {
    assert.match(
      migration,
      new RegExp(
        `AFTER INSERT OR UPDATE OR DELETE ON public\\.${sourceType}[\\s\\S]*enqueue_search_index_job\\('${sourceType}'\\)`,
      ),
    );
  }

  assert.match(migration, /job_operation := 'delete'/);
  assert.match(migration, /job_source_id := OLD\.id::TEXT/);
  assert.match(migration, /job_operation := 'upsert'/);
  assert.match(migration, /job_source_id := NEW\.id::TEXT/);
});
