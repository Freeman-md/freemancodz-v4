import type {
  IndexSourceResult,
  SearchIndexJob,
} from "@/features/search-indexing/types";

const DEFAULT_BATCH_SIZE = 5;
const POLLING_DELAY_MS = 2_000;

type WorkerLogger = Pick<Console, "error" | "log">;

type IndexWorkerDependencies = {
  claimIndexJobs: (limit: number) => Promise<SearchIndexJob[]>;
  completeIndexJob: (id: string) => Promise<SearchIndexJob | null>;
  failIndexJob: (id: string, error: unknown) => Promise<SearchIndexJob | null>;
  indexSourceRecord: (input: {
    sourceType: SearchIndexJob["sourceType"];
    sourceId: string;
  }) => Promise<IndexSourceResult>;
  removeIndexedSource: (input: {
    sourceType: SearchIndexJob["sourceType"];
    sourceId: string;
  }) => Promise<IndexSourceResult>;
  logger: WorkerLogger;
};

function jobDetails(job: SearchIndexJob) {
  return {
    jobId: job.id,
    operation: job.operation,
    sourceType: job.sourceType,
    sourceId: job.sourceId,
  };
}

export function createIndexWorker({
  claimIndexJobs: claim,
  completeIndexJob: complete,
  failIndexJob: fail,
  indexSourceRecord: index,
  removeIndexedSource: remove,
  logger,
}: IndexWorkerDependencies) {
  async function processJob(job: SearchIndexJob): Promise<void> {
    try {
      const result = job.operation === "upsert"
        ? await index({ sourceType: job.sourceType, sourceId: job.sourceId })
        : await remove({ sourceType: job.sourceType, sourceId: job.sourceId });

      const completed = await complete(job.id);

      if (!completed) {
        logger.error("Search index job could not be completed", jobDetails(job));
        return;
      }

      logger.log("Search index job completed", {
        ...jobDetails(job),
        result,
      });
    } catch (error) {
      const failed = await fail(job.id, error);

      logger.error("Search index job failed", {
        ...jobDetails(job),
        error: error instanceof Error ? error.message : String(error),
        outcome: failed?.status ?? "transition_not_applied",
        attempts: failed?.attempts ?? job.attempts,
      });
    }
  }

  return {
    async runBatch(limit = DEFAULT_BATCH_SIZE): Promise<number> {
      const jobs = await claim(limit);

      for (const job of jobs) {
        await processJob(job);
      }

      return jobs.length;
    },
  };
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function main() {
  const [
    jobRepository,
    indexing,
    removal,
    prismaModule,
  ] = await Promise.all([
    import("@/features/search-indexing/data/search-index-job.repository"),
    import("@/features/search-indexing/index-source-record"),
    import("@/features/search-indexing/remove-indexed-source"),
    import("@/lib/prisma"),
  ]);
  let stopping = false;
  const worker = createIndexWorker({
    claimIndexJobs: jobRepository.claimIndexJobs,
    completeIndexJob: jobRepository.completeIndexJob,
    failIndexJob: jobRepository.failIndexJob,
    indexSourceRecord: indexing.indexSourceRecord,
    removeIndexedSource: removal.removeIndexedSource,
    logger: console,
  });

  const stop = () => {
    stopping = true;
    console.log("Stopping search index worker after the current job.");
  };

  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  try {
    while (!stopping) {
      const claimed = await worker.runBatch();

      if (claimed === 0 && !stopping) {
        await wait(POLLING_DELAY_MS);
      }
    }
  } finally {
    await prismaModule.prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith("index-worker.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
