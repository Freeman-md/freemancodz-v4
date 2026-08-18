import { NextResponse } from "next/server";
import {
  searchIndexWorkerErrorSchema,
  searchIndexWorkerResultSchema,
} from "@/contracts/search-index-worker.contract";
import { logger } from "@/server/composition/logging.composition";
import { getCronSecret } from "@/server/infrastructure/config/env";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type { ISearchIndexService } from "@/server/modules/search-index/public";

type SearchIndexWorkerService = Pick<ISearchIndexService, "processPendingJob">;

type SearchIndexWorkerRouteDependencies = {
  getSecret: () => string | undefined;
  loadWorkerService: () => Promise<SearchIndexWorkerService>;
  logger: ILogger;
};

export function createSearchIndexWorkerGetHandler({
  getSecret,
  loadWorkerService,
  logger: routeLogger,
}: SearchIndexWorkerRouteDependencies) {
  return async function GET(request: Request) {
    const secret = getSecret();

    if (!secret) {
      routeLogger.error("Search index worker route is not configured", {
        event: "search_index.worker_failed",
        reason: "missing_cron_secret",
      });

      return NextResponse.json(
        searchIndexWorkerErrorSchema.parse({ error: "Search index worker is not configured." }),
        { status: 500 },
      );
    }

    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json(searchIndexWorkerErrorSchema.parse({ error: "Unauthorized." }), {
        status: 401,
      });
    }

    const startedAt = Date.now();

    routeLogger.info("Search index worker started", {
      event: "search_index.worker_started",
    });

    try {
      const workerService = await loadWorkerService();

      const result = searchIndexWorkerResultSchema.parse(await workerService.processPendingJob());

      if (result.outcome === "skipped") {
        routeLogger.info("Search index worker skipped", {
          event: "search_index.worker_skipped",
          durationMs: Date.now() - startedAt,
        });
      } else {
        routeLogger.info("Search index worker completed", {
          event: "search_index.worker_completed",
          attempt: result.attempt,
          documentCount: result.documentCount,
          chunkCount: result.chunkCount,
          finalState: result.finalState,
          durationMs: Date.now() - startedAt,
        });
      }

      return NextResponse.json(result);
    } catch {
      routeLogger.error("Search index worker failed", {
        event: "search_index.worker_failed",
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(
        searchIndexWorkerErrorSchema.parse({ error: "Search index worker failed." }),
        { status: 500 },
      );
    }
  };
}

const handleGet = createSearchIndexWorkerGetHandler({
  getSecret: getCronSecret,
  loadWorkerService: async () => {
    const { searchIndexService } = await import("@/server/composition-root");

    return searchIndexService;
  },
  logger,
});

export async function GET(request: Request) {
  return handleGet(request);
}
