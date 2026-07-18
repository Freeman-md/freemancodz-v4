import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const repository = readFileSync(new URL("../../src/lib/rag/data/indexing-job.repository.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../../prisma/migrations/20260718150000_add_search_index_job_lock_token/migration.sql", import.meta.url), "utf8");

test("queue claims use a UUID lease token and completion paths are token guarded", () => {
  assert.match(migration, /ADD COLUMN "lock_token" UUID/);
  assert.match(repository, /"lock_token" = gen_random_uuid\(\)/);
  assert.match(repository, /deleteMany\(\{ where: \{ id, lockToken \} \}\)/);
  assert.match(repository, /WHERE id = \$\{id\}::uuid AND "lock_token" = \$\{lockToken\}::uuid/);
});
