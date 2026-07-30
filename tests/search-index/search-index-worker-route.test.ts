import assert from "node:assert/strict";
import test from "node:test";
import {
  createSearchIndexWorkerRoute,
  resolveSearchIndexBatchLimit,
} from "@/app/api/internal/search-index-worker/route";
import { getSearchIndexWorkerSecret } from "@/server/infrastructure/config/env";

const batchResult = {
  claimed: 2,
  completed: 1,
  retried: 1,
  failed: 0,
};

function createRoute(overrides: Partial<Parameters<typeof createSearchIndexWorkerRoute>[0]> = {}) {
  const calls: number[] = [];
  const route = createSearchIndexWorkerRoute({
    cronSecret: "expected-secret",
    runBatch: async (limit) => {
      calls.push(limit);
      return batchResult;
    },
    logger: { log: () => undefined, error: () => undefined },
    getBatchLimit: () => undefined,
    now: () => 100,
    ...overrides,
  });

  return { calls, route };
}

test("worker route fails closed when CRON_SECRET is missing", async () => {
  const { calls, route } = createRoute({ cronSecret: undefined });
  const response = await route(new Request("https://example.test"));

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "Search index worker is not configured.",
  });
  assert.deepEqual(calls, []);
});

test("worker route rejects missing and invalid bearer tokens", async () => {
  const { calls, route } = createRoute();

  assert.equal((await route(new Request("https://example.test"))).status, 401);
  assert.equal((await route(new Request("https://example.test", {
    headers: { Authorization: "Bearer wrong-secret" },
  }))).status, 401);
  assert.deepEqual(calls, []);
});

test("worker route processes one default bounded batch for a valid bearer token", async () => {
  const { calls, route } = createRoute();
  const response = await route(new Request("https://example.test", {
    headers: { Authorization: "Bearer expected-secret" },
  }));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), batchResult);
  assert.deepEqual(calls, [5]);
});

test("worker route respects valid configured limits and caps them at twenty", async () => {
  const request = new Request("https://example.test", {
    headers: { Authorization: "Bearer expected-secret" },
  });
  const configured = createRoute({ getBatchLimit: () => "12" });
  const capped = createRoute({ getBatchLimit: () => "100" });

  await configured.route(request);
  await capped.route(request);

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
