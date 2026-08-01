import assert from "node:assert/strict";
import test from "node:test";
import { createSearchIndexWorkerGetHandler } from "@/app/api/internal/search-index-worker/route";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type { ISearchIndexWorkerService } from "@/server/modules/search-index/public";

function createLogger() {
  const errors: Array<{ message: string; context: unknown }> = [];

  const infos: Array<{ message: string; context: unknown }> = [];

  const logger: ILogger = {
    error: (message, context) => {
      errors.push({ message, context });
    },
    info: (message, context) => {
      infos.push({ message, context });
    },
  };

  return { errors, infos, logger };
}

function createWorker(runBatch: ISearchIndexWorkerService["runBatch"]) {
  return { runBatch } satisfies ISearchIndexWorkerService;
}

test("worker route returns a safe configuration error when no secret is available", async () => {
  const { errors, logger } = createLogger();

  let called = false;

  const GET = createSearchIndexWorkerGetHandler({
    getBatchLimit: () => "5",
    getSecret: () => undefined,
    logger,
    workerService: createWorker(async () => {
      called = true;

      return { claimed: 0, completed: 0, retried: 0, failed: 0 };
    }),
  });

  const response = await GET(new Request("http://localhost/api/internal/search-index-worker"));

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Search index worker is not configured." });
  assert.equal(called, false);
  assert.deepEqual(errors, [
    {
      message: "Search index worker route is not configured",
      context: { event: "search_index_worker.configuration_error" },
    },
  ]);
});

test("worker route rejects missing or incorrect authorization before running work", async () => {
  const { logger } = createLogger();

  let calls = 0;

  const GET = createSearchIndexWorkerGetHandler({
    getBatchLimit: () => "5",
    getSecret: () => "expected-secret",
    logger,
    workerService: createWorker(async () => {
      calls += 1;

      return { claimed: 0, completed: 0, retried: 0, failed: 0 };
    }),
  });

  for (const request of [
    new Request("http://localhost/api/internal/search-index-worker"),
    new Request("http://localhost/api/internal/search-index-worker", {
      headers: { authorization: "Bearer wrong-secret" },
    }),
  ]) {
    const response = await GET(request);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Unauthorized." });
  }

  assert.equal(calls, 0);
});

test("worker route sanitizes worker failures while retaining operational logging", async () => {
  const { errors, logger } = createLogger();

  const GET = createSearchIndexWorkerGetHandler({
    getBatchLimit: () => "5",
    getSecret: () => "expected-secret",
    logger,
    workerService: createWorker(async () => {
      throw new Error("database password leaked");
    }),
  });

  const response = await GET(
    new Request("http://localhost/api/internal/search-index-worker", {
      headers: { authorization: "Bearer expected-secret" },
    }),
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Search index worker failed." });
  assert.equal(errors[0]?.message, "Search index worker batch failed");
  assert.deepEqual(errors[0]?.context, {
    event: "search_index_worker.error",
    batchLimit: 5,
    duration:
      errors[0]?.context && typeof errors[0].context === "object"
        ? (errors[0].context as { duration: number }).duration
        : undefined,
    error: "database password leaked",
  });
});

test("worker route clamps a successful batch to its maximum limit and returns the result contract", async () => {
  const { infos, logger } = createLogger();

  const limits: number[] = [];

  const GET = createSearchIndexWorkerGetHandler({
    getBatchLimit: () => "999",
    getSecret: () => "expected-secret",
    logger,
    workerService: createWorker(async (limit) => {
      limits.push(limit ?? 0);

      return { claimed: 3, completed: 2, retried: 1, failed: 0 };
    }),
  });

  const response = await GET(
    new Request("http://localhost/api/internal/search-index-worker", {
      headers: { authorization: "Bearer expected-secret" },
    }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { claimed: 3, completed: 2, retried: 1, failed: 0 });
  assert.deepEqual(limits, [20]);
  assert.equal(infos[0]?.message, "Search index worker batch started");
  assert.equal(infos[1]?.message, "Search index worker batch completed");
});
