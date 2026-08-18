import assert from "node:assert/strict";
import test from "node:test";
import { createSearchIndexWorkerGetHandler } from "@/app/api/internal/search-index-worker/route";
import type { SearchIndexWorkerResult } from "@/contracts/search-index-worker.contract";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";

type LogEntry = {
  context: unknown;
  level: "error" | "info";
  message: string;
};

function createLogger(): ILogger & { entries: LogEntry[] } {
  const entries: LogEntry[] = [];

  return {
    entries,
    error: (message, context) => entries.push({ level: "error", message, context }),
    info: (message, context) => entries.push({ level: "info", message, context }),
  };
}

function createHandler({
  result = { outcome: "skipped" },
  secret = "cron-secret",
  run,
}: {
  result?: SearchIndexWorkerResult;
  secret?: string | null;
  run?: () => Promise<SearchIndexWorkerResult>;
} = {}) {
  const logger = createLogger();

  let calls = 0;

  let loads = 0;

  const handler = createSearchIndexWorkerGetHandler({
    getSecret: () => secret ?? undefined,
    loadWorkerService: async () => {
      loads += 1;

      return {
        processPendingJob: async () => {
          calls += 1;

          return run ? run() : result;
        },
      };
    },
    logger,
  });

  return {
    get calls() {
      return calls;
    },
    get loads() {
      return loads;
    },
    handler,
    logger,
  };
}

test("the cron route rejects missing configuration before running a job", async () => {
  const fixture = createHandler({ secret: null });

  const response = await fixture.handler(
    new Request("https://portfolio.test/api/internal/search-index-worker"),
  );

  assert.equal(response.status, 500);
  assert.equal(fixture.loads, 0);
  assert.equal(fixture.calls, 0);
  assert.deepEqual(await response.json(), { error: "Search index worker is not configured." });
  assert.deepEqual(fixture.logger.entries, [
    {
      level: "error",
      message: "Search index worker route is not configured",
      context: { event: "search_index.worker_failed", reason: "missing_cron_secret" },
    },
  ]);
});

test("the cron route accepts only the configured CRON_SECRET bearer token", async () => {
  for (const authorization of [undefined, "Bearer wrong-secret", "cron-secret"]) {
    const fixture = createHandler();

    const headers = authorization ? { authorization } : undefined;

    const response = await fixture.handler(
      new Request("https://portfolio.test/api/internal/search-index-worker", { headers }),
    );

    assert.equal(response.status, 401);
    assert.equal(fixture.loads, 0);
    assert.equal(fixture.calls, 0);
    assert.deepEqual(await response.json(), { error: "Unauthorized." });
  }
});

test("the cron route runs one job and returns a validated processed result", async () => {
  const result = {
    outcome: "processed",
    attempt: 1,
    documentCount: 33,
    chunkCount: 47,
    finalState: "completed",
  } satisfies SearchIndexWorkerResult;

  const fixture = createHandler({ result });

  const response = await fixture.handler(
    new Request("https://portfolio.test/api/internal/search-index-worker", {
      headers: { authorization: "Bearer cron-secret" },
    }),
  );

  assert.equal(response.status, 200);
  assert.equal(fixture.loads, 1);
  assert.equal(fixture.calls, 1);
  assert.deepEqual(await response.json(), result);
  assert.equal(fixture.logger.entries[0]?.message, "Search index worker started");
  assert.deepEqual(fixture.logger.entries[0]?.context, {
    event: "search_index.worker_started",
  });
  assert.equal(fixture.logger.entries[1]?.message, "Search index worker completed");
  const completionContext = fixture.logger.entries[1]?.context as Record<string, unknown>;

  assert.deepEqual(
    { ...completionContext, durationMs: 0 },
    {
      event: "search_index.worker_completed",
      attempt: 1,
      documentCount: 33,
      chunkCount: 47,
      finalState: "completed",
      durationMs: 0,
    },
  );
});

test("the cron route reports skipped work without calling a second time", async () => {
  const fixture = createHandler();

  const response = await fixture.handler(
    new Request("https://portfolio.test/api/internal/search-index-worker", {
      headers: { authorization: "Bearer cron-secret" },
    }),
  );

  assert.equal(response.status, 200);
  assert.equal(fixture.loads, 1);
  assert.equal(fixture.calls, 1);
  assert.deepEqual(await response.json(), { outcome: "skipped" });
  assert.equal(fixture.logger.entries[1]?.message, "Search index worker skipped");
  assert.equal(
    (fixture.logger.entries[1]?.context as { event: string }).event,
    "search_index.worker_skipped",
  );
});

test("the cron route hides worker failures from responses and logs", async () => {
  const sensitiveMessage = "provider token=secret content body must not escape";

  const fixture = createHandler({
    run: async () => {
      throw new Error(sensitiveMessage);
    },
  });

  const response = await fixture.handler(
    new Request("https://portfolio.test/api/internal/search-index-worker", {
      headers: { authorization: "Bearer cron-secret" },
    }),
  );

  assert.equal(response.status, 500);
  assert.equal(fixture.loads, 1);
  assert.equal(fixture.calls, 1);
  assert.deepEqual(await response.json(), { error: "Search index worker failed." });
  assert.equal(fixture.logger.entries[1]?.message, "Search index worker failed");
  assert.equal(
    (fixture.logger.entries[1]?.context as { event: string }).event,
    "search_index.worker_failed",
  );
  assert.equal(JSON.stringify(fixture.logger.entries).includes(sensitiveMessage), false);
});
