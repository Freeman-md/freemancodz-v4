import type { SearchIndexWorkerResult } from "@/contracts/search-index-worker.contract";
import { requireProductionConfirmation } from "../helpers/require-production-confirmation";

type SearchIndexRebuildService = {
  processPendingJob(): Promise<SearchIndexWorkerResult>;
  requestRebuild(): Promise<void>;
};

export async function requestAndRunSearchIndexRebuild(
  service: SearchIndexRebuildService,
): Promise<SearchIndexWorkerResult> {
  await service.requestRebuild();

  return service.processPendingJob();
}

function reportResult(result: SearchIndexWorkerResult) {
  if (result.outcome === "skipped") {
    console.log("The rebuild request was recorded, but no job was available to process.");

    return;
  }

  console.log(
    `Attempt ${result.attempt} rebuilt ${result.documentCount} documents into ${result.chunkCount} chunks; job is ${result.finalState}.`,
  );
}

async function main() {
  const { searchIndexService } = await import("@/modules/composition");

  const { prisma } = await import("@/infrastructure/database/prisma");

  try {
    reportResult(await requestAndRunSearchIndexRebuild(searchIndexService));
  } finally {
    await prisma.$disconnect();
  }
}

function start() {
  if (process.argv.includes("--production")) {
    try {
      requireProductionConfirmation();
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Production confirmation failed.");
      process.exitCode = 1;

      return;
    }
  }

  void main().catch(() => {
    console.error("Search index rebuild failed.");
    process.exitCode = 1;
  });
}

if (process.argv[1]?.endsWith("rebuild-search-index.ts")) {
  start();
}
