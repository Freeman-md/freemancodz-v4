import assert from "node:assert/strict";
import test from "node:test";
import { planIndexing } from "@/lib/rag/indexing/indexing-plan.core";

const document = (id: string, contentHash: string) => ({ id, sourceType: "projects" as const, sourceId: "source", documentIndex: 0, title: "Title", category: "Category", url: "/work", content: "Content", keywords: [], input: "input", contentHash });

test("indexing plan classifies fake stored chunks and exposes obsolete deletions for dry-run", () => {
  const plan = planIndexing([document("unchanged", "same"), document("changed", "new"), document("created", "new")], [
    { id: "unchanged", contentHash: "same", embeddingModel: "model" },
    { id: "changed", contentHash: "old", embeddingModel: "model" },
    { id: "obsolete", contentHash: "old", embeddingModel: "model" },
  ], "model");
  assert.deepEqual(plan.current.map(({ id, expectedAction }) => [id, expectedAction]), [["unchanged", "skip"], ["changed", "change"], ["created", "create"]]);
  assert.deepEqual(plan.obsoleteIds, ["obsolete"]);
});

test("embedding-model changes require a fresh embedding even when content is unchanged", () => {
  const plan = planIndexing([document("same", "hash")], [{ id: "same", contentHash: "hash", embeddingModel: "previous-model" }], "model");
  assert.equal(plan.current[0]?.expectedAction, "change");
});
