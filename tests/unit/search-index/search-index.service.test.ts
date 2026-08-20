import assert from "node:assert/strict";
import test from "node:test";

import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type {
  GeneratedEmbedding,
  IOpenAIProvider,
} from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import type { ISearchIndexJobRepository } from "@/server/modules/search-index/interfaces/search-index-job.repository.interface";
import type { ISiteChunkRepository } from "@/server/modules/search-index/interfaces/site-chunk.repository.interface";
import type {
  ClaimedSearchIndexJob,
  SearchIndexJob,
  SearchIndexJobClaimResult,
} from "@/server/modules/search-index/models/search-index-job";
import type { EmbeddedSiteChunk } from "@/server/modules/search-index/models/site-chunk";
import { SearchIndexService } from "@/server/modules/search-index/services/search-index.service";
import { createPortfolioSnapshotFixture } from "./search-index.fixture";

const CLAIMED_AT = new Date("2026-08-18T09:00:00.000Z");

const claimedJob: ClaimedSearchIndexJob = {
  jobKey: "portfolio",
  status: "processing",
  rerunRequested: false,
  attempts: 1,
  availableAt: new Date("2026-08-18T08:59:00.000Z"),
  requestedAt: new Date("2026-08-18T08:59:00.000Z"),
  claimedAt: CLAIMED_AT,
  processedAt: null,
  lastError: null,
};

function settledJob(status: "completed" | "pending"): SearchIndexJob {
  return {
    ...claimedJob,
    status,
    rerunRequested: false,
    claimedAt: null,
    processedAt: status === "completed" ? new Date("2026-08-18T09:01:00.000Z") : null,
  };
}

type ServiceOptions = {
  claim?: SearchIndexJobClaimResult;
  completeStatus?: "completed" | "pending";
  generated?: (inputs: string[]) => Promise<GeneratedEmbedding[]>;
  replace?: (chunks: EmbeddedSiteChunk[]) => Promise<void>;
  snapshot?: ReturnType<typeof createPortfolioSnapshotFixture>;
};

function createService(options: ServiceOptions = {}) {
  const snapshot = options.snapshot ?? createPortfolioSnapshotFixture();

  const pageCalls: string[] = [];

  const embeddingInputs: string[][] = [];

  const replaced: EmbeddedSiteChunk[][] = [];

  const replacementTokens: Date[] = [];

  const completedTokens: Date[] = [];

  const failed: Array<{ claimedAt: Date; summary: string }> = [];

  const events: Array<{ level: "info" | "error"; message: string; context?: unknown }> = [];

  let rebuildRequests = 0;

  const jobs: ISearchIndexJobRepository = {
    requestRebuild: async () => {
      rebuildRequests += 1;
    },
    claim: async () =>
      options.claim ?? {
        job: claimedJob,
        staleJobRecovered: false,
      },
    complete: async (claimedAt) => {
      completedTokens.push(claimedAt);

      return settledJob(options.completeStatus ?? "completed");
    },
    fail: async (claimedAt, summary) => {
      failed.push({ claimedAt, summary });

      return settledJob("pending");
    },
  };

  const chunks: ISiteChunkRepository = {
    replacePortfolioSnapshot: async (values, claimedAt) => {
      replaced.push(values);
      replacementTokens.push(claimedAt);
      await options.replace?.(values);
    },
    match: async () => [],
  };

  const openai: IOpenAIProvider = {
    getEmbeddingModel: () => "text-embedding-test",
    createEmbedding: async () => [],
    createEmbeddings: async (inputs) => {
      embeddingInputs.push(inputs);

      if (options.generated) {
        return options.generated(inputs);
      }

      return inputs.map(() => ({
        embedding: Array(1_536).fill(0.25),
        embeddingModel: "text-embedding-test",
      }));
    },
    streamResponse: async () =>
      (async function* emptyStream() {
        return;
      })(),
  };

  const logger: ILogger = {
    info: (message, context) => events.push({ level: "info", message, context }),
    error: (message, context) => events.push({ level: "error", message, context }),
  };

  const portfolio = {
    home: {
      getPageData: async () => {
        pageCalls.push("home");

        return snapshot.home;
      },
    },
    work: {
      getPageData: async () => {
        pageCalls.push("work");

        return snapshot.work;
      },
    },
    about: {
      getPageData: async () => {
        pageCalls.push("about");

        return snapshot.about;
      },
    },
    audit: {
      getPageData: async () => {
        pageCalls.push("audit");

        return snapshot.audit;
      },
    },
  };

  return {
    completedTokens,
    embeddingInputs,
    events,
    failed,
    getRebuildRequests: () => rebuildRequests,
    pageCalls,
    replaced,
    replacementTokens,
    service: new SearchIndexService(portfolio, chunks, jobs, openai, logger),
  };
}

test("skips without loading or embedding when no singleton claim is available", async () => {
  const setup = createService({ claim: { job: null, staleJobRecovered: true } });

  await setup.service.requestRebuild();
  const result = await setup.service.processPendingJob();

  assert.deepEqual(result, { outcome: "skipped" });
  assert.equal(setup.getRebuildRequests(), 1);
  assert.deepEqual(setup.pageCalls, []);
  assert.deepEqual(setup.embeddingInputs, []);
  assert.deepEqual(setup.replaced, []);
  assert.ok(setup.events.some(({ message }) => message === "search_index.stale_job_recovered"));
  assert.ok(setup.events.some(({ message }) => message === "search_index.worker_skipped"));
});

test("embeds and replaces one complete snapshot before settling the claim", async () => {
  const setup = createService({ completeStatus: "pending" });

  const result = await setup.service.processPendingJob();

  assert.deepEqual(result, {
    outcome: "processed",
    attempt: 1,
    documentCount: 5,
    chunkCount: 5,
    finalState: "pending",
  });
  assert.deepEqual(setup.pageCalls.toSorted(), ["about", "audit", "home", "work"]);
  assert.equal(setup.embeddingInputs.length, 1);
  assert.equal(setup.embeddingInputs[0]?.length, 5);
  assert.equal(setup.replaced.length, 1);
  assert.deepEqual(setup.replacementTokens, [CLAIMED_AT]);
  assert.ok(
    setup.replaced[0]?.every(
      ({ embedding, embeddingModel }) =>
        embedding.length === 1_536 && embeddingModel === "text-embedding-test",
    ),
  );
  assert.deepEqual(setup.completedTokens, [CLAIMED_AT]);
  assert.deepEqual(setup.failed, []);
});

test("invalid snapshot metadata fails before embeddings or replacement", async () => {
  const snapshot = createPortfolioSnapshotFixture();

  snapshot.home.contentBlocks[0]!.url = "https://storage.example/not-public";

  const setup = createService({ snapshot });

  await assert.rejects(setup.service.processPendingJob(), /Search index processing failed/);
  assert.deepEqual(setup.embeddingInputs, []);
  assert.deepEqual(setup.replaced, []);
  assert.equal(setup.failed[0]?.summary, "Portfolio search documents could not be prepared.");
});

test("invalid embedding count, model, dimensions or values fail before replacement", async (t) => {
  const cases: Array<{
    name: string;
    generated: ServiceOptions["generated"];
  }> = [
    {
      name: "count",
      generated: async () => [],
    },
    {
      name: "model",
      generated: async (inputs) =>
        inputs.map(() => ({ embedding: Array(1_536).fill(0), embeddingModel: "wrong-model" })),
    },
    {
      name: "dimensions",
      generated: async (inputs) =>
        inputs.map(() => ({
          embedding: Array(1_535).fill(0),
          embeddingModel: "text-embedding-test",
        })),
    },
    {
      name: "numeric values",
      generated: async (inputs) =>
        inputs.map(() => ({
          embedding: [...Array(1_535).fill(0), Number.NaN],
          embeddingModel: "text-embedding-test",
        })),
    },
  ];

  for (const item of cases) {
    await t.test(item.name, async () => {
      const setup = createService({ generated: item.generated });

      await assert.rejects(setup.service.processPendingJob(), /Search index processing failed/);
      assert.deepEqual(setup.replaced, []);
      assert.equal(setup.failed[0]?.summary, "Portfolio search embeddings could not be prepared.");
    });
  }
});

test("provider and replacement failures expose only safe categorized diagnostics", async () => {
  const providerFailure = createService({
    generated: async () => {
      throw new Error("raw-provider-secret-response");
    },
  });

  await assert.rejects(
    providerFailure.service.processPendingJob(),
    /Search index processing failed/,
  );
  assert.equal(
    providerFailure.failed[0]?.summary,
    "Portfolio search embeddings could not be prepared.",
  );
  assert.deepEqual(providerFailure.replaced, []);
  assert.doesNotMatch(JSON.stringify(providerFailure.events), /raw-provider-secret-response/);

  const replacementFailure = createService({
    replace: async () => {
      throw new Error("raw-database-stack");
    },
  });

  await assert.rejects(
    replacementFailure.service.processPendingJob(),
    /Search index processing failed/,
  );
  assert.equal(
    replacementFailure.failed[0]?.summary,
    "The portfolio search snapshot could not be replaced.",
  );
  assert.doesNotMatch(JSON.stringify(replacementFailure.events), /raw-database-stack/);
});
