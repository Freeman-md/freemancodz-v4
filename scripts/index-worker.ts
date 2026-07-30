import type { IndexWorkerBatchResult } from "@/server/modules/search-index/services/run-index-worker.service";

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
  const [{ indexWorker }, { prisma }] = await Promise.all([
    import("@/server/modules/search-index/services/run-index-worker.service"),
    import("@/server/infrastructure/database/prisma"),
  ]);
  let stopping = false;

  const stop = () => {
    stopping = true;
    console.log("Stopping search index worker after the current job.");
  };

  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  try {
    await runIndexWorkerLoop({
      runBatch: () => indexWorker.runBatch(),
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
