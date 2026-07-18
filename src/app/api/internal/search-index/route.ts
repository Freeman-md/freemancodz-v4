import "server-only";
import { NextResponse } from "next/server";
import { processIndexingJobs } from "@/lib/rag/indexing/process-indexing-jobs";
import { isAuthorizedWorkerSecret } from "@/lib/rag/indexing/worker-auth.core";

function validSecret(request: Request) {
  const expected = process.env.SEARCH_INDEX_WORKER_SECRET;
  const actual = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return isAuthorizedWorkerSecret(expected, actual);
}

export async function POST(request: Request) {
  if (!validSecret(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await processIndexingJobs(10));
}
