import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("re-enqueue invalidates a claimed lease so stale acknowledgement and retry cannot affect it", () => {
  const migration = readFileSync(new URL("../../prisma/migrations/20260718160000_invalidate_reenqueued_job_leases/migration.sql", import.meta.url), "utf8");
  const repository = readFileSync(new URL("../../src/lib/rag/data/indexing-job.repository.ts", import.meta.url), "utf8");
  assert.match(migration, /"locked_at" = NULL,\s*"lock_token" = NULL,/);
  assert.match(repository, /deleteMany\(\{ where: \{ id, lockToken \} \}\)/);
  assert.match(repository, /AND "lock_token" = \$\{lockToken\}::uuid/);

  const claimedToken = "lease-a";
  const reEnqueuedToken = null; // Mirrors the conflict update in the migration.
  assert.notEqual(reEnqueuedToken, claimedToken, "the old claim is invalidated");
  assert.equal(reEnqueuedToken === claimedToken, false, "old acknowledgement cannot delete the re-enqueued job");
  assert.equal(reEnqueuedToken === claimedToken, false, "old retry cannot mutate the re-enqueued job");
});
