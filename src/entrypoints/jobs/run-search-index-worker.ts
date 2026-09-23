import type { SearchIndexWorkerResult } from "@/contracts/search-index-worker.contract";
import { requireProductionConfirmation } from "../helpers/require-production-confirmation";

type OneShotSearchIndexService = {
  processPendingJob(): Promise<SearchIndexWorkerResult>;
};

export function runSearchIndexWorkerOnce(
  service: OneShotSearchIndexService,
): Promise<SearchIndexWorkerResult> {
  return service.processPendingJob();
}

function reportResult(result: SearchIndexWorkerResult) {
  if (result.outcome === "skipped") {
    console.log("No pending portfolio search-index job was available.");

    return;
  }

  console.log(
    `Attempt ${result.attempt} processed ${result.documentCount} documents into ${result.chunkCount} chunks; job is ${result.finalState}.`,
  );
}

async function main() {
  const { searchIndexService } = await import("@/modules/composition");

  const { prisma } = await import("@/infrastructure/database/prisma");

  try {
    reportResult(await runSearchIndexWorkerOnce(searchIndexService));
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
    console.error("Search index worker failed.");
    process.exitCode = 1;
  });
}

if (process.argv[1]?.endsWith("run-search-index-worker.ts")) {
  start();
}
