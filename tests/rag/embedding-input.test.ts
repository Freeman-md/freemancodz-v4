import assert from "node:assert/strict";
import test from "node:test";
import { chunkId, formatEmbeddingInput, hashEmbeddingInput, normalizeKeywords } from "@/lib/rag/embedding-input";

const document = { sourceType: "projects" as const, sourceId: "record-id", documentIndex: 0, title: "Project", category: "Product", url: "/work", content: "Useful content.", keywords: ["AI", "", "ai", "Systems"] };
test("embedding input has the canonical format and URL is metadata only", () => {
  assert.equal(formatEmbeddingInput(document), "Title: Project\nCategory: Product\nKeywords: ai, systems\nContent: Useful content.");
  assert.equal(chunkId(document), "projects:record-id:0");
  assert.equal(hashEmbeddingInput(formatEmbeddingInput(document)).length, 64);
  assert.deepEqual(normalizeKeywords(document.keywords), ["ai", "systems"]);
});
