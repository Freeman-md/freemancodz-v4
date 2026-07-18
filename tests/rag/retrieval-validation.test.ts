import assert from "node:assert/strict";
import test from "node:test";
import { assertQueryEmbeddingLength } from "@/lib/rag/retrieval-validation";

test("vector retrieval rejects invalid embedding dimensions before SQL", () => {
  assert.doesNotThrow(() => assertQueryEmbeddingLength(Array.from({ length: 1536 }, () => 0)));
  assert.throws(() => assertQueryEmbeddingLength([0]), /1536-length embedding, received 1/);
});
