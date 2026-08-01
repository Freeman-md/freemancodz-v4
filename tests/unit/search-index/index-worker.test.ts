import assert from "node:assert/strict";
import test from "node:test";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type { ISearchIndexJobRepository } from "@/server/modules/search-index/interfaces/search-index-job.repository.interface";
import type { ISearchIndexService } from "@/server/modules/search-index/interfaces/search-index.service.interface";
import type { SearchIndexJob } from "@/server/modules/search-index/models/search-index";
import { SearchIndexWorkerService } from "@/server/modules/search-index/services/search-index-worker.service";

const job = {
  id: "job-1",
  operation: "upsert",
  sourceType: "projects",
  sourceId: "project-1",
  status: "processing",
  attempts: 1,
  availableAt: new Date("2026-01-01T00:00:00.000Z"),
  claimedAt: new Date("2026-01-01T00:00:00.000Z"),
  lastError: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  processedAt: null,
} satisfies SearchIndexJob;

const emptyResult = { created: 0, changed: 0, unchanged: 0, deleted: 0 };

function createWorker({
  claimed = [job],
  complete = async (id: string) => ({ ...job, id, status: "completed" }) as SearchIndexJob,
  fail = async (id: string) => ({ ...job, id, status: "pending" }) as SearchIndexJob,
  indexSource = async () => emptyResult,
  removeSource = async () => emptyResult,
}: {
  claimed?: SearchIndexJob[];
  complete?: ISearchIndexJobRepository["complete"];
  fail?: ISearchIndexJobRepository["fail"];
  indexSource?: ISearchIndexService["indexSource"];
  removeSource?: ISearchIndexService["removeSource"];
} = {}) {
  const claimLimits: number[] = [];

  const completedIds: string[] = [];

  const failed: Array<{ id: string; error: unknown }> = [];

  const infos: Array<{ message: string; context: unknown }> = [];

  const errors: Array<{ message: string; context: unknown }> = [];

  const jobs: ISearchIndexJobRepository = {
    claim: async (limit) => {
      claimLimits.push(limit);

      return claimed;
    },
    complete: async (id) => {
      completedIds.push(id);

      return complete(id);
    },
    fail: async (id, error) => {
      failed.push({ id, error });

      return fail(id, error);
    },
    enqueue: async () => job,
    getStatus: async () => ({}) as never,
  };

  const searchIndex: ISearchIndexService = {
    indexSource,
    removeSource,
    search: async () => [],
    preview: async () => ({ input: {} as never, chunks: [], obsoleteIds: [] }),
    rebuild: async () => ({ totals: emptyResult, results: [] }),
    getJobStatus: async () => ({}) as never,
  };

  const logger: ILogger = {
    info: (message, context) => {
      infos.push({ message, context });
    },
    error: (message, context) => {
      errors.push({ message, context });
    },
  };

  return {
    claimLimits,
    completedIds,
    errors,
    failed,
    infos,
    service: new SearchIndexWorkerService(jobs, searchIndex, logger),
  };
}

test("worker completes an upsert job and records the completed outcome", async () => {
  const { completedIds, infos, service } = createWorker();

  assert.deepEqual(await service.runBatch(), { claimed: 1, completed: 1, retried: 0, failed: 0 });
  assert.deepEqual(completedIds, [job.id]);
  assert.equal(infos[0]?.message, "Search index job completed");
  assert.deepEqual(infos[0]?.context, {
    jobId: job.id,
    operation: "upsert",
    sourceType: "projects",
    sourceId: job.sourceId,
    result: emptyResult,
  });
});

test("worker completes a delete job through the removal capability", async () => {
  const deleteJob = {
    ...job,
    operation: "delete",
    sourceType: "services",
    sourceId: "service-1",
  } as SearchIndexJob;

  const removed: Array<{ sourceType: string; sourceId: string }> = [];

  const { service } = createWorker({
    claimed: [deleteJob],
    indexSource: async () => {
      throw new Error("upsert should not run");
    },
    removeSource: async (input) => {
      removed.push(input);

      return { created: 0, changed: 0, unchanged: 0, deleted: 1 };
    },
  });

  assert.deepEqual(await service.runBatch(), { claimed: 1, completed: 1, retried: 0, failed: 0 });
  assert.deepEqual(removed, [{ sourceType: "services", sourceId: "service-1" }]);
});

test("worker records retryable failures and their operational log", async () => {
  const failure = new Error("embedding unavailable");

  const { errors, failed, service } = createWorker({
    indexSource: async () => {
      throw failure;
    },
  });

  assert.deepEqual(await service.runBatch(), { claimed: 1, completed: 0, retried: 1, failed: 0 });
  assert.deepEqual(failed, [{ id: job.id, error: failure }]);
  assert.equal(errors[0]?.message, "Search index job failed");
  assert.deepEqual(errors[0]?.context, {
    jobId: job.id,
    operation: "upsert",
    sourceType: "projects",
    sourceId: "project-1",
    error: "embedding unavailable",
    outcome: "pending",
    attempts: 1,
  });
});

test("worker records terminal failures and their terminal outcome", async () => {
  const failure = new Error("source cannot be indexed");

  const { errors, failed, service } = createWorker({
    fail: async (id) => ({ ...job, id, status: "failed", attempts: 3 }),
    indexSource: async () => {
      throw failure;
    },
  });

  assert.deepEqual(await service.runBatch(), { claimed: 1, completed: 0, retried: 0, failed: 1 });
  assert.deepEqual(failed, [{ id: job.id, error: failure }]);
  assert.deepEqual(errors[0]?.context, {
    jobId: job.id,
    operation: "upsert",
    sourceType: "projects",
    sourceId: "project-1",
    error: "source cannot be indexed",
    outcome: "failed",
    attempts: 3,
  });
});

test("worker leaves jobs unsettled when a completion or failure transition is not applied", async () => {
  const completion = createWorker({ complete: async () => null });

  const failure = createWorker({
    fail: async () => null,
    indexSource: async () => {
      throw new Error("transient failure");
    },
  });

  assert.deepEqual(await completion.service.runBatch(), {
    claimed: 1,
    completed: 0,
    retried: 0,
    failed: 0,
  });
  assert.equal(completion.errors[0]?.message, "Search index job could not be completed");
  assert.deepEqual(await failure.service.runBatch(), {
    claimed: 1,
    completed: 0,
    retried: 0,
    failed: 0,
  });
  assert.equal(failure.errors[0]?.message, "Search index job failed");
  assert.equal(
    (failure.errors[0]?.context as { outcome: string } | undefined)?.outcome,
    "transition_not_applied",
  );
});

test("worker passes an explicit batch limit to the job claim boundary", async () => {
  const { claimLimits, service } = createWorker({ claimed: [] });

  assert.deepEqual(await service.runBatch(7), { claimed: 0, completed: 0, retried: 0, failed: 0 });
  assert.deepEqual(claimLimits, [7]);
});
