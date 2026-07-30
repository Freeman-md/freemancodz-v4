import assert from "node:assert/strict";
import test from "node:test";
import {
  createAuthenticatedIndexWorker,
  resolveSearchIndexBatchLimit,
} from "@/server/modules/search-index/public";
import { getSearchIndexWorkerSecret } from "@/server/infrastructure/config/env";

const batchResult = {
  claimed: 2,
  completed: 1,
  retried: 1,
  failed: 0,
};

function createWorker(overrides: Partial<Parameters<typeof createAuthenticatedIndexWorker>[0]> = {}) {
  const calls: number[] = [];
  const worker = createAuthenticatedIndexWorker({
    getSecret: () => "expected-secret",
    runBatch: async (limit) => {
      calls.push(limit);
      return batchResult;
    },
    logger: { info: () => undefined, error: () => undefined },
    getBatchLimit: () => undefined,
    now: () => 100,
    ...overrides,
  });

  return { calls, worker };
}

test("worker route fails closed when CRON_SECRET is missing", async () => {
  const { calls, worker } = createWorker({ getSecret: () => undefined });
  const response = await worker(null);

  assert.equal(response.status, 500);
  assert.deepEqual(response, {
    status: 500,
    error: "Search index worker is not configured.",
  });
  assert.deepEqual(calls, []);
});

test("worker route rejects missing and invalid bearer tokens", async () => {
  const { calls, worker } = createWorker();

  assert.equal((await worker(null)).status, 401);
  assert.equal((await worker("Bearer wrong-secret")).status, 401);
  assert.deepEqual(calls, []);
});

test("worker route processes one default bounded batch for a valid bearer token", async () => {
  const { calls, worker } = createWorker();
  const response = await worker("Bearer expected-secret");

  assert.equal(response.status, 200);
  assert.deepEqual(response, { status: 200, result: batchResult });
  assert.deepEqual(calls, [5]);
});

test("worker route respects valid configured limits and caps them at twenty", async () => {
  const configured = createWorker({ getBatchLimit: () => "12" });
  const capped = createWorker({ getBatchLimit: () => "100" });

  await configured.worker("Bearer expected-secret");
  await capped.worker("Bearer expected-secret");

  assert.deepEqual(configured.calls, [12]);
  assert.deepEqual(capped.calls, [20]);
  assert.equal(resolveSearchIndexBatchLimit("0"), 5);
  assert.equal(resolveSearchIndexBatchLimit("invalid"), 5);
});

test("worker secret keeps the existing cron configuration as a fallback", () => {
  const originalWorkerSecret = process.env.SEARCH_INDEX_WORKER_SECRET;
  const originalCronSecret = process.env.CRON_SECRET;
  delete process.env.SEARCH_INDEX_WORKER_SECRET;
  process.env.CRON_SECRET = "existing-cron-secret";
  try {
    assert.equal(getSearchIndexWorkerSecret(), "existing-cron-secret");
  } finally {
    if (originalWorkerSecret === undefined) delete process.env.SEARCH_INDEX_WORKER_SECRET;
    else process.env.SEARCH_INDEX_WORKER_SECRET = originalWorkerSecret;
    if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalCronSecret;
  }
});
