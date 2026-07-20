import { NextResponse } from "next/server";
import { indexWorker } from "@/features/search-indexing/index-worker";
import type { IndexWorkerBatchResult } from "@/features/search-indexing/index-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_BATCH_LIMIT = 5;
const MAX_BATCH_LIMIT = 20;

type WorkerRouteDependencies = {
  cronSecret: string | undefined;
  runBatch: (limit: number) => Promise<IndexWorkerBatchResult>;
  logger: Pick<Console, "error" | "log">;
  getBatchLimit: () => string | undefined;
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

export function createSearchIndexWorkerRoute({
  cronSecret,
  runBatch,
  logger,
  getBatchLimit,
  now,
}: WorkerRouteDependencies) {
  return async function GET(request: Request) {
    if (!cronSecret) {
      logger.error("Search index worker route is not configured", {
        event: "search_index_worker.configuration_error",
      });
      return NextResponse.json(
        { error: "Search index worker is not configured." },
        { status: 500 },
      );
    }

    if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const batchLimit = resolveSearchIndexBatchLimit(getBatchLimit());
    const startedAt = now();
    logger.log("Search index worker batch started", {
      event: "search_index_worker.started",
      batchLimit,
    });

    try {
      const result = await runBatch(batchLimit);
      const duration = now() - startedAt;

      logger.log("Search index worker batch completed", {
        event: "search_index_worker.completed",
        batchLimit,
        ...result,
        duration,
      });

      return NextResponse.json(result);
    } catch (error) {
      const duration = now() - startedAt;
      logger.error("Search index worker batch failed", {
        event: "search_index_worker.error",
        batchLimit,
        claimed: 0,
        completed: 0,
        retried: 0,
        failed: 0,
        duration,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return NextResponse.json(
        { error: "Search index worker failed." },
        { status: 500 },
      );
    }
  };
}

export const GET = createSearchIndexWorkerRoute({
  cronSecret: process.env.CRON_SECRET,
  runBatch: (limit) => indexWorker.runBatch(limit),
  logger: console,
  getBatchLimit: () => process.env.SEARCH_INDEX_BATCH_LIMIT,
  now: Date.now,
});
