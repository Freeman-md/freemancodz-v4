import type { IndexWorkerBatchResult } from "@/server/modules/search-index/public";
import { searchIndexWorkerService } from "@/server/composition-root";

const POLLING_DELAY_MS = 2_000;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function runIndexWorkerLoop({
  runBatch,
  isStopping,
}: {
  runBatch: () => Promise<IndexWorkerBatchResult>;
  isStopping: () => boolean;
}): Promise<void> {
  while (!isStopping()) {
    const result = await runBatch();

    if (result.claimed === 0 && !isStopping()) {
      await wait(POLLING_DELAY_MS);
    }
  }
}

async function main() {
  const { prisma } = await import("@/server/infrastructure/database/prisma");

  let stopping = false;

  const stop = () => {
    stopping = true;
    console.log("Stopping search index worker after the current job.");
  };

  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  try {
    await runIndexWorkerLoop({
      runBatch: () => searchIndexWorkerService.runBatch(),
      isStopping: () => stopping,
    });
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith("index-worker.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
