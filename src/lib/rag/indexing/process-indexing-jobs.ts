import "server-only";
import { acknowledgeIndexingJob, claimIndexingJobs, retryIndexingJob } from "../data/indexing-job.repository";
import { indexSourceRecord } from "./index-source-record";
import { removeIndexedSource } from "./remove-indexed-source";

export async function processIndexingJobs(limit = 10) {
  const jobs = await claimIndexingJobs(Math.min(Math.max(limit, 1), 50));
  let succeeded = 0; let failed = 0;
  for (const { id, job } of jobs) {
    try {
      if (job.operation === "upsert") await indexSourceRecord(job);
      else await removeIndexedSource(job);
      await acknowledgeIndexingJob(id); succeeded += 1;
    } catch (error) {
      console.error(`Search indexing job failed for ${job.sourceType}:${job.sourceId}`, error);
      await retryIndexingJob(id, error); failed += 1;
    }
  }
  return { claimed: jobs.length, succeeded, failed };
}
