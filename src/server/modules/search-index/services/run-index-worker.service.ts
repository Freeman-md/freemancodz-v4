import "server-only";

import {
  claimIndexJobs,
  completeIndexJob,
  failIndexJob,
} from "@/server/modules/search-index/repositories/search-index-job.repository";
import { indexSourceRecord } from "@/server/modules/search-index/services/index-source-record.service";
import { removeIndexedSource } from "@/server/modules/search-index/services/remove-indexed-source.service";
import type {
  IndexSourceResult,
  SearchIndexJob,
} from "@/server/modules/search-index/models/search-index.model";

export type IndexWorkerBatchResult = {
  claimed: number;
  completed: number;
  retried: number;
  failed: number;
};

type WorkerLogger = Pick<Console, "error" | "log">;

export type IndexWorkerDependencies = {
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

type JobOutcome = "completed" | "retried" | "failed" | "unsettled";

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
  async function processJob(job: SearchIndexJob): Promise<JobOutcome> {
    try {
      const result = job.operation === "upsert"
        ? await index({ sourceType: job.sourceType, sourceId: job.sourceId })
        : await remove({ sourceType: job.sourceType, sourceId: job.sourceId });

      const completed = await complete(job.id);

      if (!completed) {
        logger.error("Search index job could not be completed", jobDetails(job));
        return "unsettled";
      }

      logger.log("Search index job completed", {
        ...jobDetails(job),
        result,
      });
      return "completed";
    } catch (error) {
      const failed = await fail(job.id, error);
      const outcome = failed?.status === "pending"
        ? "retried"
        : failed?.status === "failed"
          ? "failed"
          : "unsettled";

      logger.error("Search index job failed", {
        ...jobDetails(job),
        error: error instanceof Error ? error.message : String(error),
        outcome: failed?.status ?? "transition_not_applied",
        attempts: failed?.attempts ?? job.attempts,
      });

      return outcome;
    }
  }

  return {
    async runBatch(limit = 5): Promise<IndexWorkerBatchResult> {
      const jobs = await claim(limit);
      const result: IndexWorkerBatchResult = {
        claimed: jobs.length,
        completed: 0,
        retried: 0,
        failed: 0,
      };

      for (const job of jobs) {
        const outcome = await processJob(job);

        if (outcome !== "unsettled") {
          result[outcome] += 1;
        }
      }

      return result;
    },
  };
}

export const indexWorker = createIndexWorker({
  claimIndexJobs,
  completeIndexJob,
  failIndexJob,
  indexSourceRecord,
  removeIndexedSource,
  logger: console,
});
