import "server-only";
import { acknowledgeIndexingJob, claimIndexingJobs, retryIndexingJob } from "../data/indexing-job.repository";
import { indexSourceRecord } from "./index-source-record";
import { removeIndexedSource } from "./remove-indexed-source";
import { processClaimedIndexingJobs, type IndexingJobProcessorDependencies } from "./process-indexing-jobs.core";
export type { IndexingJobProcessorDependencies } from "./process-indexing-jobs.core";

const productionDependencies: IndexingJobProcessorDependencies = {
  claim: claimIndexingJobs,
  acknowledge: acknowledgeIndexingJob,
  retry: retryIndexingJob,
  index: indexSourceRecord,
  remove: removeIndexedSource,
  log: console.error,
};

export async function processIndexingJobs(limit = 10, dependencies = productionDependencies) {
  return processClaimedIndexingJobs(limit, dependencies);
}
