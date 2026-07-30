import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import type { SearchDocument } from "@/server/modules/search-index/models/search-index";
import { prepareSiteChunk } from "@/server/modules/search-index/factories/site-chunk.factory";

const baseDocument = {
  sourceType: "projects",
  sourceId: "project-1",
  documentIndex: 0,
  title: "Grounded Assistant",
  category: "AI Engineering",
  url: "/work",
  content: "A cited assistant for portfolio content.",
  keywords: ["zeta", "alpha", "beta"],
} satisfies SearchDocument;

test("prepareSiteChunk creates the exact deterministic prepared chunk", () => {
  const embeddingInput = [
    "Title: Grounded Assistant",
    "Category: AI Engineering",
    "Keywords: alpha, beta, zeta",
    "Content: A cited assistant for portfolio content.",
  ].join("\n");
  const contentHash = createHash("sha256")
    .update(embeddingInput)
    .digest("hex");

  assert.deepEqual(prepareSiteChunk(baseDocument), {
    ...baseDocument,
    id: "projects:project-1:0",
    chunkIndex: 0,
    keywords: ["alpha", "beta", "zeta"],
    embeddingInput,
    contentHash,
  });
});

test("prepareSiteChunk is deterministic for the same document", () => {
  assert.deepEqual(
    prepareSiteChunk(baseDocument),
    prepareSiteChunk(baseDocument),
  );
});

test("changing only the title changes semantic output but preserves the stable id", () => {
  const renamedDocument = {
    ...baseDocument,
    title: "Evidence-Grounded Assistant",
  } satisfies SearchDocument;

  const preparedBase = prepareSiteChunk(baseDocument);
  const preparedRenamed = prepareSiteChunk(renamedDocument);

  assert.equal(preparedRenamed.id, preparedBase.id);
  assert.notEqual(preparedRenamed.embeddingInput, preparedBase.embeddingInput);
  assert.notEqual(preparedRenamed.contentHash, preparedBase.contentHash);
});

test("keyword ordering does not affect normalized semantic output", () => {
  const reorderedDocument = {
    ...baseDocument,
    keywords: ["beta", "zeta", "alpha"],
  } satisfies SearchDocument;

  const preparedBase = prepareSiteChunk(baseDocument);
  const preparedReordered = prepareSiteChunk(reorderedDocument);

  assert.deepEqual(preparedReordered.keywords, ["alpha", "beta", "zeta"]);
  assert.equal(preparedReordered.embeddingInput, preparedBase.embeddingInput);
  assert.equal(preparedReordered.contentHash, preparedBase.contentHash);
});

test("prepareSiteChunk removes duplicate, blank and padded keywords deterministically", () => {
  const document = {
    ...baseDocument,
    keywords: [" zeta ", "", "beta", "  ", "alpha", "beta", "zeta"],
  } satisfies SearchDocument;
  const embeddingInput = [
    "Title: Grounded Assistant",
    "Category: AI Engineering",
    "Keywords: alpha, beta, zeta",
    "Content: A cited assistant for portfolio content.",
  ].join("\n");
  const contentHash = createHash("sha256")
    .update(embeddingInput)
    .digest("hex");

  assert.deepEqual(prepareSiteChunk(document), {
    ...document,
    id: "projects:project-1:0",
    chunkIndex: 0,
    keywords: ["alpha", "beta", "zeta"],
    embeddingInput,
    contentHash,
  });
});

test("changing only the URL preserves semantic output and returns the changed URL", () => {
  const changedUrlDocument = {
    ...baseDocument,
    url: "/work/grounded-assistant",
  } satisfies SearchDocument;

  const preparedBase = prepareSiteChunk(baseDocument);
  const preparedChangedUrl = prepareSiteChunk(changedUrlDocument);

  assert.equal(preparedChangedUrl.url, "/work/grounded-assistant");
  assert.equal(preparedChangedUrl.embeddingInput, preparedBase.embeddingInput);
  assert.equal(preparedChangedUrl.contentHash, preparedBase.contentHash);
});

test("changing the document index changes id and chunk index but not semantic output", () => {
  const changedIndexDocument = {
    ...baseDocument,
    documentIndex: 4,
  } satisfies SearchDocument;

  const preparedBase = prepareSiteChunk(baseDocument);
  const preparedChangedIndex = prepareSiteChunk(changedIndexDocument);

  assert.equal(preparedChangedIndex.id, "projects:project-1:4");
  assert.equal(preparedChangedIndex.chunkIndex, 4);
  assert.notEqual(preparedChangedIndex.id, preparedBase.id);
  assert.notEqual(preparedChangedIndex.chunkIndex, preparedBase.chunkIndex);
  assert.equal(
    preparedChangedIndex.embeddingInput,
    preparedBase.embeddingInput,
  );
  assert.equal(preparedChangedIndex.contentHash, preparedBase.contentHash);
});
