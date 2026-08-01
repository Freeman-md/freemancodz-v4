import assert from "node:assert/strict";
import test from "node:test";
import type { Principle, Project } from "@/generated/prisma/client";
import type { IOpenAIProvider } from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import { prepareSiteChunk } from "@/server/modules/search-index/factories/site-chunk.factory";
import type { IIndexingSourceRepository } from "@/server/modules/search-index/interfaces/indexing-source.repository.interface";
import type { ISearchIndexJobRepository } from "@/server/modules/search-index/interfaces/search-index-job.repository.interface";
import type { ISiteChunkRepository } from "@/server/modules/search-index/interfaces/site-chunk.repository.interface";
import { buildProjectDocuments } from "@/server/modules/search-index/mappers/build-project-documents";
import type {
  ExistingSiteChunk,
  IndexableSource,
  ReplaceIndexedSourceInput,
} from "@/server/modules/search-index/models/search-index";
import { SearchIndexService } from "@/server/modules/search-index/services/search-index.service";

const project = {
  id: "project-1",
  title: "Grounded Assistant",
  summary: "Summary",
  category: "AI",
  role: "Engineer",
  outcome: "Outcome",
  detail: "Detail",
  future: null,
  collaboration: null,
  positioning: null,
  featured: true,
  position: 1,
  stacks: ["TypeScript"],
  links: [],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
} satisfies Project;

const unsupportedPrinciple = {
  id: "principle-contact",
  section: "contact",
  title: "Contact",
  body: "Get in touch.",
  position: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
} satisfies Principle;

const preparedProjectChunk = prepareSiteChunk(buildProjectDocuments(project)[0]!);

function existingChunk(overrides: Partial<ExistingSiteChunk> = {}): ExistingSiteChunk {
  return {
    id: preparedProjectChunk.id,
    sourceType: "projects",
    sourceId: project.id,
    chunkIndex: preparedProjectChunk.chunkIndex,
    contentHash: preparedProjectChunk.contentHash,
    embeddingModel: "model",
    ...overrides,
  };
}

function createService({
  source = { sourceType: "projects", record: project } satisfies IndexableSource,
  existing = [],
  embeddingModel = "model",
  createEmbeddings,
  findSource,
  replaceSource,
}: {
  source?: IndexableSource | null;
  existing?: ExistingSiteChunk[];
  embeddingModel?: string;
  createEmbeddings?: IOpenAIProvider["createEmbeddings"];
  findSource?: IIndexingSourceRepository["findById"];
  replaceSource?: ISiteChunkRepository["replaceSource"];
} = {}) {
  const embeddingInputs: string[][] = [];

  const replacements: ReplaceIndexedSourceInput[] = [];

  const sources: IIndexingSourceRepository = {
    findById: findSource ?? (async () => source),
    findAll: async () => (source ? [source] : []),
  };

  const chunks: ISiteChunkRepository = {
    findBySource: async () => existing,
    replaceSource: async (input) => {
      replacements.push(input);
      await replaceSource?.(input);
    },
    deleteSource: async () => 0,
    match: async () => [],
  };

  const jobs: ISearchIndexJobRepository = {
    enqueue: async () => ({}) as never,
    claim: async () => [],
    complete: async () => null,
    fail: async () => null,
    getStatus: async () => ({}) as never,
  };

  const openai: IOpenAIProvider = {
    getEmbeddingModel: () => embeddingModel,
    createEmbedding: async () => [],
    createEmbeddings: async (inputs) => {
      embeddingInputs.push(inputs);

      return createEmbeddings
        ? createEmbeddings(inputs)
        : inputs.map(() => ({ embedding: [0.25, 0.75], embeddingModel }));
    },
    streamResponse: async () => ({}) as never,
  };

  return {
    embeddingInputs,
    replacements,
    service: new SearchIndexService(sources, chunks, jobs, openai),
  };
}

test("search-index service creates a new source with an embedded replacement payload", async () => {
  const { embeddingInputs, replacements, service } = createService();

  const result = await service.indexSource({ sourceType: "projects", sourceId: project.id });

  assert.deepEqual(result, { created: 1, changed: 0, unchanged: 0, deleted: 0 });
  assert.deepEqual(embeddingInputs, [[preparedProjectChunk.embeddingInput]]);
  assert.equal(replacements.length, 1);
  assert.deepEqual(replacements[0], {
    sourceType: "projects",
    sourceId: project.id,
    obsoleteIds: [],
    upserts: [
      {
        ...preparedProjectChunk,
        embedding: [0.25, 0.75],
        embeddingModel: "model",
        embeddedAt: replacements[0]?.upserts[0]?.embeddedAt,
      },
    ],
  });
  assert.ok(replacements[0]?.upserts[0]?.embeddedAt instanceof Date);
});

test("search-index service updates an existing chunk when its embedding model changes", async () => {
  const { embeddingInputs, replacements, service } = createService({
    existing: [existingChunk({ embeddingModel: "old-model" })],
    embeddingModel: "new-model",
  });

  const result = await service.indexSource({ sourceType: "projects", sourceId: project.id });

  assert.deepEqual(result, { created: 0, changed: 1, unchanged: 0, deleted: 0 });
  assert.deepEqual(embeddingInputs, [[preparedProjectChunk.embeddingInput]]);
  assert.equal(replacements[0]?.upserts.length, 1);
  assert.equal(replacements[0]?.upserts[0]?.id, preparedProjectChunk.id);
  assert.equal(replacements[0]?.upserts[0]?.embeddingModel, "new-model");
  assert.deepEqual(replacements[0]?.upserts[0]?.embedding, [0.25, 0.75]);
  assert.deepEqual(replacements[0]?.obsoleteIds, []);
});

test("search-index service atomically removes obsolete chunks without embedding unchanged content", async () => {
  const stale = existingChunk({ id: "projects:project-1:stale", chunkIndex: 99 });

  const { embeddingInputs, replacements, service } = createService({
    existing: [existingChunk(), stale],
  });

  const result = await service.indexSource({ sourceType: "projects", sourceId: project.id });

  assert.deepEqual(result, { created: 0, changed: 0, unchanged: 1, deleted: 1 });
  assert.deepEqual(embeddingInputs, []);
  assert.deepEqual(replacements, [
    {
      sourceType: "projects",
      sourceId: project.id,
      upserts: [],
      obsoleteIds: [stale.id],
    },
  ]);
});

test("search-index service handles an unsupported principle without generating embeddings", async () => {
  const obsolete = existingChunk({
    id: "principles:principle-contact:0",
    sourceType: "principles",
    sourceId: unsupportedPrinciple.id,
  });

  const { embeddingInputs, replacements, service } = createService({
    source: { sourceType: "principles", record: unsupportedPrinciple },
    existing: [obsolete],
  });

  const result = await service.indexSource({
    sourceType: "principles",
    sourceId: unsupportedPrinciple.id,
  });

  assert.deepEqual(result, { created: 0, changed: 0, unchanged: 0, deleted: 1 });
  assert.deepEqual(embeddingInputs, []);
  assert.deepEqual(replacements[0], {
    sourceType: "principles",
    sourceId: unsupportedPrinciple.id,
    upserts: [],
    obsoleteIds: [obsolete.id],
  });
});

test("search-index service wraps a missing source without persistence or provider work", async () => {
  const { embeddingInputs, replacements, service } = createService({ source: null });

  await assert.rejects(
    service.indexSource({ sourceType: "projects", sourceId: "missing" }),
    /Failed to index projects:missing: Source record was not found\./,
  );
  assert.deepEqual(embeddingInputs, []);
  assert.deepEqual(replacements, []);
});

test("search-index service wraps provider and persistence failures with their causes", async () => {
  const providerFailure = new Error("embedding provider unavailable");

  const repositoryFailure = new Error("replacement transaction unavailable");

  const providerService = createService({
    createEmbeddings: async () => {
      throw providerFailure;
    },
  }).service;

  const repositoryService = createService({
    replaceSource: async () => {
      throw repositoryFailure;
    },
  }).service;

  for (const [service, failure] of [
    [providerService, providerFailure],
    [repositoryService, repositoryFailure],
  ] as const) {
    await assert.rejects(
      service.indexSource({ sourceType: "projects", sourceId: project.id }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /Failed to index projects:project-1:/);
        assert.equal(error.cause, failure);

        return true;
      },
    );
  }
});

test("search-index preview reports create, update, unchanged, and obsolete actions", async () => {
  const stale = existingChunk({ id: "projects:project-1:stale", chunkIndex: 99 });

  const createPreview = await createService().service.preview({
    sourceType: "projects",
    sourceId: project.id,
  });

  const updatePreview = await createService({
    existing: [existingChunk({ embeddingModel: "old-model" })],
  }).service.preview({ sourceType: "projects", sourceId: project.id });

  const unchangedPreview = await createService({
    existing: [existingChunk(), stale],
  }).service.preview({
    sourceType: "projects",
    sourceId: project.id,
  });

  assert.equal(createPreview.chunks[0]?.expectedAction, "create");
  assert.equal(updatePreview.chunks[0]?.expectedAction, "update");
  assert.equal(unchangedPreview.chunks[0]?.expectedAction, "unchanged");
  assert.deepEqual(unchangedPreview.obsoleteIds, [stale.id]);
});
