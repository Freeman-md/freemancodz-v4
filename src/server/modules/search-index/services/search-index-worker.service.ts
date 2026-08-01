import "server-only";
import type { ISearchIndexJobRepository } from "../interfaces/search-index-job.repository.interface";
import type { ISearchIndexService } from "../interfaces/search-index.service.interface";
import type { ISearchIndexWorkerService } from "../interfaces/search-index-worker.service.interface";
import type { IndexWorkerBatchResult, SearchIndexJob } from "../models/search-index";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
export class SearchIndexWorkerService implements ISearchIndexWorkerService {
  constructor(
    private readonly jobs: ISearchIndexJobRepository,
    private readonly searchIndex: ISearchIndexService,
    private readonly logger: ILogger,
  ) {}

  async runBatch(limit = 5): Promise<IndexWorkerBatchResult> {
    const jobs = await this.jobs.claim(limit);

    const result = { claimed: jobs.length, completed: 0, retried: 0, failed: 0 };

    for (const job of jobs) {
      const outcome = await this.process(job);

      if (outcome !== "unsettled") {
        result[outcome] += 1;
      }
    }

    return result;
  }

  private async process(
    job: SearchIndexJob,
  ): Promise<"completed" | "retried" | "failed" | "unsettled"> {
    const details = {
      jobId: job.id,
      operation: job.operation,
      sourceType: job.sourceType,
      sourceId: job.sourceId,
    };

    try {
      const result =
        job.operation === "upsert"
          ? await this.searchIndex.indexSource({
              sourceType: job.sourceType,
              sourceId: job.sourceId,
            })
          : await this.searchIndex.removeSource({
              sourceType: job.sourceType,
              sourceId: job.sourceId,
            });

      if (!(await this.jobs.complete(job.id))) {
        this.logger.error("Search index job could not be completed", details);

        return "unsettled";
      }

      this.logger.info("Search index job completed", { ...details, result });

      return "completed";
    } catch (error) {
      const failed = await this.jobs.fail(job.id, error);

      const outcome =
        failed?.status === "pending"
          ? "retried"
          : failed?.status === "failed"
            ? "failed"
            : "unsettled";

      this.logger.error("Search index job failed", {
        ...details,
        error: error instanceof Error ? error.message : String(error),
        outcome: failed?.status ?? "transition_not_applied",
        attempts: failed?.attempts ?? job.attempts,
      });

      return outcome;
    }
  }
}
