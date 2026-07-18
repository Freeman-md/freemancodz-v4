import assert from "node:assert/strict";
import test from "node:test";
import { indexSourceRecordCore, type IndexSourceDependencies } from "@/lib/rag/indexing/index-source-record.core";
import { removeIndexedSourceCore } from "@/lib/rag/indexing/remove-indexed-source.core";
import { rebuildSearchIndexCore } from "@/lib/rag/indexing/rebuild-index.core";

const vector = Array.from({ length: 1536 }, () => 0.1);
const document = (id = "projects:source:0", hash = "hash") => ({
  id, sourceType: "projects" as const, sourceId: "source", documentIndex: 0, title: "Title", category: "Category", url: "/work", content: "Content", keywords: ["keyword"], input: "input", contentHash: hash,
});

function dependencies(overrides: Partial<IndexSourceDependencies> = {}): IndexSourceDependencies {
  return {
    preview: async () => [document()], findExisting: async () => [], embeddingModel: () => "model",
    embed: async () => [vector], write: async () => undefined, ...overrides,
  };
}

test("unchanged chunks make zero embedding and write calls", async () => {
  let embeddings = 0; let writes = 0;
  const result = await indexSourceRecordCore({ sourceType: "projects", sourceId: "source" }, dependencies({
    findExisting: async () => [{ id: "projects:source:0", contentHash: "hash", embeddingModel: "model" }],
    embed: async () => { embeddings += 1; return [vector]; }, write: async () => { writes += 1; },
  }));
  assert.deepEqual(result.created + result.changed, 0); assert.equal(embeddings, 0); assert.equal(writes, 0);
});

test("changed and new chunks are atomically written while obsolete chunks are deleted", async () => {
  let received: { writes: unknown[]; obsolete: string[] } | undefined;
  const result = await indexSourceRecordCore({ sourceType: "projects", sourceId: "source" }, dependencies({
    preview: async () => [document("projects:source:0", "new"), { ...document("projects:source:1", "fresh"), documentIndex: 1 }],
    findExisting: async () => [{ id: "projects:source:0", contentHash: "old", embeddingModel: "model" }, { id: "obsolete", contentHash: "old", embeddingModel: "model" }],
    write: async (writes, obsolete) => { received = { writes, obsolete }; },
  }));
  assert.deepEqual(result, { created: 1, changed: 1, unchanged: 0, deleted: 1, preview: result.preview });
  assert.equal(received?.writes.length, 2); assert.deepEqual(received?.obsolete, ["obsolete"]);
});

test("embedding failures occur before writes and preserve the previous index", async () => {
  let writes = 0;
  await assert.rejects(() => indexSourceRecordCore({ sourceType: "projects", sourceId: "source" }, dependencies({
    findExisting: async () => [{ id: "projects:source:0", contentHash: "old", embeddingModel: "model" }],
    embed: async () => { throw new Error("OpenAI unavailable"); }, write: async () => { writes += 1; },
  })), /Indexing projects:source failed/);
  assert.equal(writes, 0);
});

test("source deletion is idempotent", async () => {
  const counts = [2, 0];
  const remove = async () => ({ count: counts.shift() ?? 0 });
  assert.deepEqual(await removeIndexedSourceCore({ sourceType: "projects", sourceId: "source" }, remove), { deleted: 2 });
  assert.deepEqual(await removeIndexedSourceCore({ sourceType: "projects", sourceId: "source" }, remove), { deleted: 0 });
});

test("rebuild uses its shared index path, dry-run writes nothing, and removes orphans", async () => {
  const records = { content_blocks: [], projects: [{ id: "live" }], services: [], principles: [], experiences: [] } as never;
  const calls: string[] = [];
  const base = {
    loadAll: async () => records,
    preview: async ({ sourceId }: { sourceType: "projects"; sourceId: string }) => { calls.push(`preview:${sourceId}`); return []; },
    index: async ({ sourceId }: { sourceType: "projects"; sourceId: string }) => { calls.push(`index:${sourceId}`); return { created: 1, changed: 0, unchanged: 0, deleted: 0, preview: [] }; },
    listChunks: async () => [{ sourceType: "projects", sourceId: "orphan" }],
    remove: async ({ sourceId }: { sourceType: "projects"; sourceId: string }) => { calls.push(`remove:${sourceId}`); return { deleted: 1 }; },
  };
  await rebuildSearchIndexCore({ dryRun: true }, base as never);
  assert.deepEqual(calls, ["preview:live"]);
  calls.length = 0;
  assert.deepEqual(await rebuildSearchIndexCore({}, base as never), { created: 1, changed: 0, unchanged: 0, deleted: 1 });
  assert.deepEqual(calls, ["index:live", "remove:orphan"]);
});
