import type { IndexableSourceType } from "../types";

type ClaimedJob = { id: string; job: { operation: "upsert" | "delete"; sourceType: IndexableSourceType; sourceId: string } };

export type IndexingJobProcessorDependencies = {
  claim: (limit: number) => Promise<ClaimedJob[]>;
  acknowledge: (id: string) => Promise<unknown>;
  retry: (id: string, error: unknown) => Promise<unknown>;
  index: (job: { sourceType: IndexableSourceType; sourceId: string }) => Promise<unknown>;
  remove: (job: { sourceType: IndexableSourceType; sourceId: string }) => Promise<unknown>;
  log: (message: string, error: unknown) => void;
};

export async function processClaimedIndexingJobs(limit: number, dependencies: IndexingJobProcessorDependencies) {
  const jobs = await dependencies.claim(Math.min(Math.max(limit, 1), 50));
  let succeeded = 0; let failed = 0;
  for (const { id, job } of jobs) {
    try {
      if (job.operation === "upsert") await dependencies.index(job);
      else await dependencies.remove(job);
      await dependencies.acknowledge(id); succeeded += 1;
    } catch (error) {
      dependencies.log(`Search indexing job failed for ${job.sourceType}:${job.sourceId}`, error);
      await dependencies.retry(id, error); failed += 1;
    }
  }
  return { claimed: jobs.length, succeeded, failed };
}
