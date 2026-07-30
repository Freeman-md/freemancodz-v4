import { NextResponse } from "next/server";
import { searchIndexWorkerErrorSchema, searchIndexWorkerResultSchema } from "@/contracts/search-index-worker.contract";
import { runAuthenticatedIndexWorker } from "@/server/modules/search-index/public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const outcome = await runAuthenticatedIndexWorker(request.headers.get("authorization"));

  if (outcome.status === 200) {
    return NextResponse.json(searchIndexWorkerResultSchema.parse(outcome.result));
  }

  return NextResponse.json(searchIndexWorkerErrorSchema.parse({ error: outcome.error }), { status: outcome.status });
}
