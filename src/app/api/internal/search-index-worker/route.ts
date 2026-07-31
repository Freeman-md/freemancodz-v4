import { NextResponse } from "next/server";
import { searchIndexWorkerErrorSchema, searchIndexWorkerResultSchema } from "@/contracts/search-index-worker.contract";
import { getSearchIndexWorkerBatchLimit, getSearchIndexWorkerSecret } from "@/server/infrastructure/config/env";
import { logger } from "@/server/infrastructure/logging/logger";
import { searchIndexWorkerService } from "@/server/composition-root";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const DEFAULT_BATCH_LIMIT = 5;
const MAX_BATCH_LIMIT = 20;
function parseBatchLimit(value: string | undefined): number { if (!value || !/^\d+$/.test(value)) return DEFAULT_BATCH_LIMIT; const limit = Number(value); return !Number.isSafeInteger(limit) || limit < 1 ? DEFAULT_BATCH_LIMIT : Math.min(limit, MAX_BATCH_LIMIT); }

export async function GET(request: Request) {
  const secret = getSearchIndexWorkerSecret();
  if (!secret) { logger.error("Search index worker route is not configured", { event: "search_index_worker.configuration_error" }); return NextResponse.json(searchIndexWorkerErrorSchema.parse({ error: "Search index worker is not configured." }), { status: 500 }); }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json(searchIndexWorkerErrorSchema.parse({ error: "Unauthorized." }), { status: 401 });
  const batchLimit = parseBatchLimit(getSearchIndexWorkerBatchLimit()); const startedAt = Date.now(); logger.info("Search index worker batch started", { event: "search_index_worker.started", batchLimit });
  try { const result = await searchIndexWorkerService.runBatch(batchLimit); logger.info("Search index worker batch completed", { event: "search_index_worker.completed", batchLimit, ...result, duration: Date.now() - startedAt }); return NextResponse.json(searchIndexWorkerResultSchema.parse(result)); } catch (error) { logger.error("Search index worker batch failed", { event: "search_index_worker.error", batchLimit, duration: Date.now() - startedAt, error: error instanceof Error ? error.message : "Unknown error" }); return NextResponse.json(searchIndexWorkerErrorSchema.parse({ error: "Search index worker failed." }), { status: 500 }); }
}
