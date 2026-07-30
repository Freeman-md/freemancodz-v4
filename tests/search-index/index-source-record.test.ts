import assert from "node:assert/strict";
import test from "node:test";
import type { ContentBlock, Project } from "@/generated/prisma/client";
import {
  createIndexSourceRecord,
} from "@/server/modules/search-index/services/index-source-record.service";
import { prepareSiteChunk } from "@/server/modules/search-index/factories/site-chunk.factory";
import type {
  ExistingSiteChunk,
  SearchDocument,
} from "@/server/modules/search-index/models/search-index";

const timestamp = new Date("2026-07-19T00:00:00.000Z");
const embeddingModel = "text-embedding-3-small";

const project = {
  id: "project-1",
  title: "Grounded Assistant",
  summary: "A customer-facing assistant grounded in trusted sources.",
  category: "AI Engineering",
  role: "Full-stack engineer",
  outcome: "Produced cited answers from portfolio content.",
  detail: "Implemented retrieval, context injection and answer generation.",
  future: null,
  collaboration: null,
  positioning: "A practical customer-facing assistant.",
  featured: true,
  position: 1,
  stacks: ["TypeScript", "Next.js", "Supabase"],
  links: [],
  createdAt: timestamp,
  updatedAt: timestamp,
} satisfies Project;

const projectDocument = {
  sourceType: "projects",
  sourceId: "project-1",
  documentIndex: 0,
  title: "Grounded Assistant",
  category: "AI Engineering",
  url: "/work",
  content: [
    "Summary: A customer-facing assistant grounded in trusted sources.",
    "Role: Full-stack engineer",
    "Outcome: Produced cited answers from portfolio content.",
    "Details: Implemented retrieval, context injection and answer generation.",
    "Positioning: A practical customer-facing assistant.",
    "Technologies: Next.js, Supabase, TypeScript",
  ].join("\n\n"),
  keywords: [
    "AI Engineering",
    "Full-stack engineer",
    "Next.js",
    "Supabase",
    "TypeScript",
  ],
} satisfies SearchDocument;

const preparedProject = prepareSiteChunk(projectDocument);
const existingProjectChunk = {
  id: preparedProject.id,
  sourceType: "projects",
  sourceId: "project-1",
  chunkIndex: 0,
  contentHash: preparedProject.contentHash,
  embeddingModel,
} satisfies ExistingSiteChunk;

test("indexSourceRecord creates and embeds a new chunk", async () => {
  const embeddingInputs: string[][] = [];
  const replaceInputs: { upserts: { embeddedAt: Date }[] }[] = [];
  const operation = createIndexSourceRecord({
    findIndexableSource: async (sourceType, sourceId) => {
      assert.deepEqual([sourceType, sourceId], ["projects", "project-1"]);
      return { sourceType: "projects", record: project };
    },
    findIndexedChunksBySource: async (sourceType, sourceId) => {
      assert.deepEqual([sourceType, sourceId], ["projects", "project-1"]);
      return [];
    },
    createEmbeddings: async (inputs) => {
      embeddingInputs.push(inputs);
      return [{ embedding: [0.1, 0.2], embeddingModel }];
    },
    replaceIndexedSource: async (input) => {
      replaceInputs.push(input);
    },
    getEmbeddingModel: () => embeddingModel,
  });

  const result = await operation({
    sourceType: "projects",
    sourceId: "project-1",
  });

  assert.deepEqual(result, {
    created: 1,
    changed: 0,
    unchanged: 0,
    deleted: 0,
  });
  assert.deepEqual(embeddingInputs, [[preparedProject.embeddingInput]]);
  assert.equal(replaceInputs.length, 1);
  assert.deepEqual(replaceInputs[0], {
    sourceType: "projects",
    sourceId: "project-1",
    upserts: [
      {
        ...preparedProject,
        embedding: [0.1, 0.2],
        embeddingModel,
        embeddedAt: replaceInputs[0].upserts[0].embeddedAt,
      },
    ],
    obsoleteIds: [],
  });
});

test("indexSourceRecord leaves an identical chunk unchanged without embedding or upsert", async () => {
  let embeddingCalls = 0;
  const replaceInputs: { upserts: { embeddedAt: Date }[] }[] = [];
  const operation = createIndexSourceRecord({
    findIndexableSource: async () => ({
      sourceType: "projects",
      record: project,
    }),
    findIndexedChunksBySource: async () => [existingProjectChunk],
    createEmbeddings: async () => {
      embeddingCalls += 1;
      return [];
    },
    replaceIndexedSource: async (input) => {
      replaceInputs.push(input);
    },
    getEmbeddingModel: () => embeddingModel,
  });

  const result = await operation({
    sourceType: "projects",
    sourceId: "project-1",
  });

  assert.deepEqual(result, {
    created: 0,
    changed: 0,
    unchanged: 1,
    deleted: 0,
  });
  assert.equal(embeddingCalls, 0);
  assert.deepEqual(replaceInputs, [
    {
      sourceType: "projects",
      sourceId: "project-1",
      upserts: [],
      obsoleteIds: [],
    },
  ]);
});

test("indexSourceRecord embeds and updates a changed chunk", async () => {
  let embeddingCalls = 0;
  let replaceInput: unknown;
  const operation = createIndexSourceRecord({
    findIndexableSource: async () => ({
      sourceType: "projects",
      record: project,
    }),
    findIndexedChunksBySource: async () => [
      { ...existingProjectChunk, contentHash: "old-hash" },
    ],
    createEmbeddings: async (inputs) => {
      embeddingCalls += 1;
      assert.deepEqual(inputs, [preparedProject.embeddingInput]);
      return [{ embedding: [0.3, 0.4], embeddingModel }];
    },
    replaceIndexedSource: async (input) => {
      replaceInput = input;
    },
    getEmbeddingModel: () => embeddingModel,
  });

  const result = await operation({
    sourceType: "projects",
    sourceId: "project-1",
  });

  assert.deepEqual(result, {
    created: 0,
    changed: 1,
    unchanged: 0,
    deleted: 0,
  });
  assert.equal(embeddingCalls, 1);
  assert.deepEqual(replaceInput, {
    sourceType: "projects",
    sourceId: "project-1",
    upserts: [
      {
        ...preparedProject,
        embedding: [0.3, 0.4],
        embeddingModel,
        embeddedAt: (replaceInput as { upserts: [{ embeddedAt: Date }] })
          .upserts[0].embeddedAt,
      },
    ],
    obsoleteIds: [],
  });
});

test("indexSourceRecord re-embeds a chunk when the embedding model changes", async () => {
  let embeddingCalls = 0;
  const replaceInputs: { upserts: { embeddedAt: Date }[] }[] = [];
  const operation = createIndexSourceRecord({
    findIndexableSource: async () => ({
      sourceType: "projects",
      record: project,
    }),
    findIndexedChunksBySource: async () => [
      { ...existingProjectChunk, embeddingModel: "old-embedding-model" },
    ],
    createEmbeddings: async () => {
      embeddingCalls += 1;
      return [{ embedding: [0.5], embeddingModel }];
    },
    replaceIndexedSource: async (input) => {
      replaceInputs.push(input);
    },
    getEmbeddingModel: () => embeddingModel,
  });

  const result = await operation({
    sourceType: "projects",
    sourceId: "project-1",
  });

  assert.deepEqual(result, {
    created: 0,
    changed: 1,
    unchanged: 0,
    deleted: 0,
  });
  assert.equal(embeddingCalls, 1);
  assert.equal(replaceInputs.length, 1);
  assert.deepEqual(replaceInputs[0], {
    sourceType: "projects",
    sourceId: "project-1",
    upserts: [
      {
        ...preparedProject,
        embedding: [0.5],
        embeddingModel,
        embeddedAt: replaceInputs[0].upserts[0].embeddedAt,
      },
    ],
    obsoleteIds: [],
  });
});

test("indexSourceRecord deletes an unsupported ContentBlock without embeddings", async () => {
  const contentBlock = {
    id: "block-1",
    key: "home.unknown",
    page: "HOME",
    section: "HERO",
    position: 0,
    content: { unsupported: true },
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies ContentBlock;
  let embeddingCalls = 0;
  const replaceInputs: unknown[] = [];
  const operation = createIndexSourceRecord({
    findIndexableSource: async () => ({
      sourceType: "content_blocks",
      record: contentBlock,
    }),
    findIndexedChunksBySource: async () => [
      {
        ...existingProjectChunk,
        id: "content_blocks:block-1:0",
        sourceType: "content_blocks",
        sourceId: "block-1",
      },
    ],
    createEmbeddings: async () => {
      embeddingCalls += 1;
      return [];
    },
    replaceIndexedSource: async (input) => {
      replaceInputs.push(input);
    },
    getEmbeddingModel: () => embeddingModel,
  });

  const result = await operation({
    sourceType: "content_blocks",
    sourceId: "block-1",
  });

  assert.deepEqual(result, {
    created: 0,
    changed: 0,
    unchanged: 0,
    deleted: 1,
  });
  assert.equal(embeddingCalls, 0);
  assert.deepEqual(replaceInputs, [
    {
      sourceType: "content_blocks",
      sourceId: "block-1",
      upserts: [],
      obsoleteIds: ["content_blocks:block-1:0"],
    },
  ]);
});

test("indexSourceRecord passes obsolete document IDs to replacement", async () => {
  const obsoleteId = "projects:project-1:9";
  let replaceInput: unknown;
  const operation = createIndexSourceRecord({
    findIndexableSource: async () => ({
      sourceType: "projects",
      record: project,
    }),
    findIndexedChunksBySource: async () => [
      existingProjectChunk,
      { ...existingProjectChunk, id: obsoleteId, chunkIndex: 9 },
    ],
    createEmbeddings: async () => [],
    replaceIndexedSource: async (input) => {
      replaceInput = input;
    },
    getEmbeddingModel: () => embeddingModel,
  });

  const result = await operation({
    sourceType: "projects",
    sourceId: "project-1",
  });

  assert.deepEqual(result, {
    created: 0,
    changed: 0,
    unchanged: 1,
    deleted: 1,
  });
  assert.deepEqual(replaceInput, {
    sourceType: "projects",
    sourceId: "project-1",
    upserts: [],
    obsoleteIds: [obsoleteId],
  });
});

test("indexSourceRecord wraps embedding failures and does not replace the source", async () => {
  const embeddingError = new Error("embedding unavailable");
  let replaceCalls = 0;
  const operation = createIndexSourceRecord({
    findIndexableSource: async () => ({
      sourceType: "projects",
      record: project,
    }),
    findIndexedChunksBySource: async () => [],
    createEmbeddings: async () => {
      throw embeddingError;
    },
    replaceIndexedSource: async () => {
      replaceCalls += 1;
    },
    getEmbeddingModel: () => embeddingModel,
  });

  await assert.rejects(
    operation({ sourceType: "projects", sourceId: "project-1" }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(
        error.message,
        "Failed to index projects:project-1: embedding unavailable",
      );
      assert.equal(error.cause, embeddingError);
      return true;
    },
  );
  assert.equal(replaceCalls, 0);
});
