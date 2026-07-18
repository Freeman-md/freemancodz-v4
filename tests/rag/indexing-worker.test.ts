import assert from "node:assert/strict";
import test from "node:test";
import { processClaimedIndexingJobs } from "@/lib/rag/indexing/process-indexing-jobs.core";

test("worker uses a fake queue to index, delete, acknowledge, and retry jobs independently", async () => {
  const calls: string[] = [];
  const jobs = [
    { id: "upsert", lockToken: new Date(1), job: { operation: "upsert" as const, sourceType: "projects" as const, sourceId: "one" } },
    { id: "delete", lockToken: new Date(2), job: { operation: "delete" as const, sourceType: "projects" as const, sourceId: "two" } },
    { id: "failed", lockToken: new Date(3), job: { operation: "upsert" as const, sourceType: "projects" as const, sourceId: "three" } },
  ];
  const result = await processClaimedIndexingJobs(100, {
    claim: async (limit) => { calls.push(`claim:${limit}`); return jobs; },
    index: async ({ sourceId }) => { calls.push(`index:${sourceId}`); if (sourceId === "three") throw new Error("embedding failed"); },
    remove: async ({ sourceId }) => { calls.push(`remove:${sourceId}`); },
    acknowledge: async (id, lockToken) => { calls.push(`ack:${id}:${lockToken.getTime()}`); },
    retry: async (id) => { calls.push(`retry:${id}`); },
    log: () => undefined,
  });
  assert.deepEqual(result, { claimed: 3, succeeded: 2, failed: 1 });
  assert.deepEqual(calls, ["claim:50", "index:one", "ack:upsert:1", "remove:two", "ack:delete:2", "index:three", "retry:failed"]);
});
