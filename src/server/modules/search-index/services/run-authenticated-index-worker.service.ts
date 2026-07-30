import "server-only";

import { getSearchIndexWorkerBatchLimit, getSearchIndexWorkerSecret } from "@/server/infrastructure/config/env";
import { logger } from "@/server/infrastructure/logging/logger";
import { indexWorker, type IndexWorkerBatchResult } from "./run-index-worker.service";

const DEFAULT_BATCH_LIMIT = 5;
const MAX_BATCH_LIMIT = 20;

type WorkerLogger = Pick<typeof logger, "error" | "info">;

export type SearchIndexWorkerRequestResult =
  | { status: 200; result: IndexWorkerBatchResult }
  | { status: 401; error: "Unauthorized." }
  | { status: 500; error: "Search index worker is not configured." | "Search index worker failed." };

export type SearchIndexWorkerRequestDependencies = {
  getSecret: () => string | undefined;
  getBatchLimit: () => string | undefined;
  runBatch: (limit: number) => Promise<IndexWorkerBatchResult>;
  logger: WorkerLogger;
  now: () => number;
};

export function resolveSearchIndexBatchLimit(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) {
    return DEFAULT_BATCH_LIMIT;
  }

  const limit = Number(value);

  if (!Number.isSafeInteger(limit) || limit < 1) {
    return DEFAULT_BATCH_LIMIT;
  }

  return Math.min(limit, MAX_BATCH_LIMIT);
}

export function createAuthenticatedIndexWorker({
  getSecret,
  getBatchLimit,
  runBatch,
  logger: log,
  now,
}: SearchIndexWorkerRequestDependencies) {
  return async function runAuthenticatedIndexWorker(authorization: string | null): Promise<SearchIndexWorkerRequestResult> {
    const secret = getSecret();

    if (!secret) {
      log.error("Search index worker route is not configured", {
        event: "search_index_worker.configuration_error",
      });
      return { status: 500, error: "Search index worker is not configured." };
    }

    if (authorization !== `Bearer ${secret}`) {
      return { status: 401, error: "Unauthorized." };
    }

    const batchLimit = resolveSearchIndexBatchLimit(getBatchLimit());
    const startedAt = now();
    log.info("Search index worker batch started", {
      event: "search_index_worker.started",
      batchLimit,
    });

    try {
      const result = await runBatch(batchLimit);
      log.info("Search index worker batch completed", {
        event: "search_index_worker.completed",
        batchLimit,
        ...result,
        duration: now() - startedAt,
      });
      return { status: 200, result };
    } catch (error) {
      log.error("Search index worker batch failed", {
        event: "search_index_worker.error",
        batchLimit,
        claimed: 0,
        completed: 0,
        retried: 0,
        failed: 0,
        duration: now() - startedAt,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return { status: 500, error: "Search index worker failed." };
    }
  };
}

export const runAuthenticatedIndexWorker = createAuthenticatedIndexWorker({
  getSecret: getSearchIndexWorkerSecret,
  getBatchLimit: getSearchIndexWorkerBatchLimit,
  runBatch: (limit) => indexWorker.runBatch(limit),
  logger,
  now: Date.now,
});
