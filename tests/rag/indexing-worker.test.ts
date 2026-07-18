import assert from "node:assert/strict";
import test from "node:test";
import { processClaimedIndexingJobs } from "@/lib/rag/indexing/process-indexing-jobs.core";

test("worker uses a fake queue to index, delete, acknowledge, and retry jobs independently", async () => {
  const calls: string[] = [];
  const jobs = [
    { id: "upsert", lockToken: "lease-one", job: { operation: "upsert" as const, sourceType: "projects" as const, sourceId: "one" } },
    { id: "delete", lockToken: "lease-two", job: { operation: "delete" as const, sourceType: "projects" as const, sourceId: "two" } },
    { id: "failed", lockToken: "lease-three", job: { operation: "upsert" as const, sourceType: "projects" as const, sourceId: "three" } },
  ];
  const result = await processClaimedIndexingJobs(100, {
    claim: async (limit) => { calls.push(`claim:${limit}`); return jobs; },
    index: async ({ sourceId }) => { calls.push(`index:${sourceId}`); if (sourceId === "three") throw new Error("embedding failed"); },
    remove: async ({ sourceId }) => { calls.push(`remove:${sourceId}`); },
    acknowledge: async (id, lockToken) => { calls.push(`ack:${id}:${lockToken}`); return { count: 1 }; },
    retry: async (id, lockToken) => { calls.push(`retry:${id}:${lockToken}`); return 1; },
    log: () => undefined,
  });
  assert.deepEqual(result, { claimed: 3, succeeded: 2, failed: 1 });
  assert.deepEqual(calls, ["claim:50", "index:one", "ack:upsert:lease-one", "remove:two", "ack:delete:lease-two", "index:three", "retry:failed:lease-three"]);
});

test("a lost lease is not acknowledged or retried with a stale token", async () => {
  const calls: string[] = [];
  const result = await processClaimedIndexingJobs(1, {
    claim: async () => [{ id: "job", lockToken: "old-lease", job: { operation: "upsert" as const, sourceType: "projects" as const, sourceId: "source" } }],
    index: async () => undefined,
    remove: async () => undefined,
    acknowledge: async () => ({ count: 0 }),
    retry: async (_id, token) => { calls.push(token); return 0; },
    log: () => undefined,
  });
  assert.deepEqual(result, { claimed: 1, succeeded: 0, failed: 1 });
  assert.deepEqual(calls, ["old-lease"]);
});
