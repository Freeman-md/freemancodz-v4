import assert from "node:assert/strict";
import test from "node:test";
import { createIndexWorker } from "../../scripts/index-worker";
import type { SearchIndexJob } from "@/features/search-indexing/types";

function makeJob(overrides: Partial<SearchIndexJob> = {}): SearchIndexJob {
  return {
    id: "job-1",
    operation: "upsert",
    sourceType: "projects",
    sourceId: "project-1",
    status: "processing",
    attempts: 1,
    availableAt: new Date("2026-07-20T10:00:00.000Z"),
    claimedAt: new Date("2026-07-20T10:00:00.000Z"),
    lastError: null,
    createdAt: new Date("2026-07-20T10:00:00.000Z"),
    processedAt: null,
    ...overrides,
  };
}

test("worker indexes upsert jobs, completes them, and logs result counts", async () => {
  const job = makeJob();
  const indexed: unknown[] = [];
  const completed: string[] = [];
  const logs: unknown[][] = [];
  const worker = createIndexWorker({
    claimIndexJobs: async () => [job],
    completeIndexJob: async (id) => {
      completed.push(id);
      return { ...job, status: "completed" };
    },
    failIndexJob: async () => null,
    indexSourceRecord: async (input) => {
      indexed.push(input);
      return { created: 1, changed: 2, unchanged: 3, deleted: 0 };
    },
    removeIndexedSource: async () => {
      throw new Error("delete should not be called");
    },
    logger: {
      log: (...args: unknown[]) => logs.push(args),
      error: () => undefined,
    },
  });

  assert.equal(await worker.runBatch(), 1);
  assert.deepEqual(indexed, [{ sourceType: "projects", sourceId: "project-1" }]);
  assert.deepEqual(completed, ["job-1"]);
  assert.deepEqual(logs, [[
    "Search index job completed",
    {
      jobId: "job-1",
      operation: "upsert",
      sourceType: "projects",
      sourceId: "project-1",
      result: { created: 1, changed: 2, unchanged: 3, deleted: 0 },
    },
  ]]);
});

test("worker removes indexed chunks for delete jobs", async () => {
  const job = makeJob({ operation: "delete", sourceType: "services" });
  const removed: unknown[] = [];
  const worker = createIndexWorker({
    claimIndexJobs: async () => [job],
    completeIndexJob: async () => ({ ...job, status: "completed" }),
    failIndexJob: async () => null,
    indexSourceRecord: async () => {
      throw new Error("upsert should not be called");
    },
    removeIndexedSource: async (input) => {
      removed.push(input);
      return { created: 0, changed: 0, unchanged: 0, deleted: 2 };
    },
    logger: { log: () => undefined, error: () => undefined },
  });

  await worker.runBatch();
  assert.deepEqual(removed, [{ sourceType: "services", sourceId: "project-1" }]);
});

test("worker sends indexing failures to retry handling and logs the retry outcome", async () => {
  const job = makeJob();
  const retryCalls: unknown[][] = [];
  const errors: unknown[][] = [];
  const worker = createIndexWorker({
    claimIndexJobs: async () => [job],
    completeIndexJob: async () => null,
    failIndexJob: async (...args) => {
      retryCalls.push(args);
      return { ...job, status: "pending", attempts: 1 };
    },
    indexSourceRecord: async () => {
      throw new Error("embedding unavailable");
    },
    removeIndexedSource: async () => ({
      created: 0,
      changed: 0,
      unchanged: 0,
      deleted: 0,
    }),
    logger: { log: () => undefined, error: (...args: unknown[]) => errors.push(args) },
  });

  await worker.runBatch();
  assert.equal(retryCalls.length, 1);
  assert.equal(retryCalls[0][0], "job-1");
  assert.ok(retryCalls[0][1] instanceof Error);
  assert.deepEqual(errors, [[
    "Search index job failed",
    {
      jobId: "job-1",
      operation: "upsert",
      sourceType: "projects",
      sourceId: "project-1",
      error: "embedding unavailable",
      outcome: "pending",
      attempts: 1,
    },
  ]]);
});
