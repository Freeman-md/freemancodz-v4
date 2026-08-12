import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import type { PrismaClient } from "@/generated/prisma/client";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type { IOpenAIProvider } from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import { chunkText } from "@/server/modules/search-index/chunking/text-chunker";
import type { ISearchIndexJobRepository } from "@/server/modules/search-index/interfaces/search-index-job.repository.interface";
import type { ISourceRecordRepository } from "@/server/modules/search-index/interfaces/source-record.repository.interface";
import type { ISiteChunkRepository } from "@/server/modules/search-index/interfaces/site-chunk.repository.interface";
import { SearchIndexJobRepository } from "@/server/modules/search-index/repositories/search-index-job.repository";
import { SourceRecordRepository } from "@/server/modules/search-index/repositories/source-record.repository";
import { SearchIndexService } from "@/server/modules/search-index/services/search-index.service";
import { SiteSearchService } from "@/server/modules/search-index/services/site-search.service";

const DEFERRED_INDEXING_PATTERN = /deferred search-index milestone/;

test("the portfolio migration retires legacy triggers before tables and preserves search data", async () => {
  const migration = await readFile(
    resolve(
      process.cwd(),
      "prisma/migrations/20260812090000_rebuild_portfolio_content/migration.sql",
    ),
    "utf8",
  );

  for (const sourceType of [
    "content_blocks",
    "projects",
    "services",
    "principles",
    "experiences",
  ]) {
    const dropTrigger = migration.indexOf(
      `DROP TRIGGER IF EXISTS "${sourceType}_search_index_job" ON public.${sourceType};`,
    );

    const dropTable = migration.indexOf(`DROP TABLE public.${sourceType};`);

    assert.ok(dropTrigger >= 0, `Expected the ${sourceType} indexing trigger to be removed.`);
    assert.ok(
      dropTable > dropTrigger,
      `Expected ${sourceType} trigger removal before table removal.`,
    );
  }

  assert.doesNotMatch(
    migration,
    /(?:DROP TABLE|DELETE FROM) public\.(?:site_chunks|search_index_jobs)/,
  );
  assert.doesNotMatch(migration, /CREATE TRIGGER "[^"]+_search_index_job"/);
});

test("legacy portfolio source reads fail closed without querying removed Prisma models", async () => {
  const database = new Proxy(
    {},
    {
      get: () => {
        throw new Error("The database must not be queried for legacy portfolio sources.");
      },
    },
  ) as PrismaClient;

  const repository = new SourceRecordRepository(database);

  await assert.rejects(
    repository.findById("projects", "legacy-project"),
    DEFERRED_INDEXING_PATTERN,
  );
  await assert.rejects(repository.findAll(), DEFERRED_INDEXING_PATTERN);
});

test("legacy portfolio job claims remain pending for later reconciliation", async () => {
  const rawQueries: string[] = [];

  const transaction = {
    $executeRaw: async (parts: TemplateStringsArray) => {
      rawQueries.push(parts.join("?"));

      return 0;
    },
    $queryRaw: async (parts: TemplateStringsArray) => {
      rawQueries.push(parts.join("?"));

      return [];
    },
  };

  const database = {
    $transaction: async (run: (client: typeof transaction) => Promise<unknown>) => run(transaction),
  } as unknown as PrismaClient;

  const repository = new SearchIndexJobRepository(database);

  assert.deepEqual(await repository.claim(5), []);

  const claimQuery = rawQueries.find((query) => query.includes("jobs_to_claim"));

  assert.ok(claimQuery);
  for (const sourceType of [
    "content_blocks",
    "projects",
    "services",
    "principles",
    "experiences",
  ]) {
    assert.match(claimQuery, new RegExp(`'${sourceType}'`));
  }
});

test("direct legacy source removal cannot delete existing SiteChunks", async () => {
  let deleteCalls = 0;

  const sources: ISourceRecordRepository = {
    findById: async () => null,
    findAll: async () => [],
  };

  const chunks: ISiteChunkRepository = {
    findBySource: async () => [],
    replaceSource: async () => undefined,
    deleteSource: async () => {
      deleteCalls += 1;

      return 1;
    },
    match: async () => [],
    clear: async () => undefined,
  };

  const jobs: ISearchIndexJobRepository = {
    claim: async () => [],
    complete: async () => null,
    fail: async () => null,
    getStatus: async () => ({}) as never,
    clear: async () => undefined,
  };

  const openai: IOpenAIProvider = {
    getEmbeddingModel: () => "unused",
    createEmbedding: async () => [],
    createEmbeddings: async () => [],
    streamResponse: async () => ({}) as never,
  };

  const logger: ILogger = { info: () => undefined, error: () => undefined };

  const service = new SearchIndexService(sources, chunks, jobs, openai, logger);

  await assert.rejects(
    service.removeSource({ sourceType: "projects", sourceId: "legacy-project" }),
    DEFERRED_INDEXING_PATTERN,
  );
  assert.equal(deleteCalls, 0);
});

test("existing SiteChunk retrieval remains callable with unchanged search defaults", async () => {
  const existingChunk = {
    id: "projects:legacy-project:0",
    sourceType: "projects",
    sourceId: "legacy-project",
    chunkIndex: 0,
    title: "Existing project",
    category: "Project",
    url: "/work",
    content: "Existing indexed content remains searchable.",
    keywords: ["existing", "project"],
    similarity: 0.9,
  };

  const calls: Array<{ matchCount: number | undefined; matchThreshold: number | undefined }> = [];

  const chunks: ISiteChunkRepository = {
    findBySource: async () => [],
    replaceSource: async () => undefined,
    deleteSource: async () => 0,
    match: async (_embedding, matchCount, matchThreshold) => {
      calls.push({ matchCount, matchThreshold });

      return [existingChunk];
    },
    clear: async () => undefined,
  };

  const service = new SiteSearchService(chunks);

  assert.deepEqual(await service.search(Array(1536).fill(0)), [existingChunk]);
  assert.deepEqual(calls, [{ matchCount: 6, matchThreshold: 0.25 }]);
});

test("deferred compatibility keeps deterministic chunk splitting without generating embeddings", () => {
  assert.deepEqual(chunkText(["One paragraph.", "Two paragraphs."]), [
    "One paragraph.\n\nTwo paragraphs.",
  ]);
  assert.ok(chunkText(["x".repeat(1_201)]).every((chunk) => chunk.length <= 1_200));
});
