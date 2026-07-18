import type { IndexableSourceType } from "../types";
import { planIndexing, type PreparedDocument, type StoredIndexChunk } from "./indexing-plan.core";

export type ChunkWrite = PreparedDocument & {
  sourceType: IndexableSourceType;
  sourceId: string;
  chunkIndex: number;
  embedding: number[];
  embeddingModel: string;
  embeddedAt: Date;
};

export type IndexingResult = { created: number; changed: number; unchanged: number; deleted: number; preview: PreparedDocument[] };

export type IndexSourceDependencies = {
  preview: (source: { sourceType: IndexableSourceType; sourceId: string }) => Promise<PreparedDocument[]>;
  findExisting: (sourceType: IndexableSourceType, sourceId: string) => Promise<StoredIndexChunk[]>;
  embeddingModel: () => string;
  embed: (model: string, input: string[]) => Promise<number[][]>;
  write: (writes: ChunkWrite[], obsoleteIds: string[]) => Promise<void>;
};

export async function indexSourceRecordCore({ sourceType, sourceId }: { sourceType: IndexableSourceType; sourceId: string }, dependencies: IndexSourceDependencies): Promise<IndexingResult> {
  try {
    const [documents, existing] = await Promise.all([dependencies.preview({ sourceType, sourceId }), dependencies.findExisting(sourceType, sourceId)]);
    const model = dependencies.embeddingModel();
    const plan = planIndexing(documents, existing, model);
    const changed = plan.current.filter((document) => document.expectedAction !== "skip");
    const embeddings = new Map<string, number[]>();
    if (changed.length) {
      const values = await dependencies.embed(model, changed.map((document) => document.input));
      for (const [index, embedding] of values.entries()) {
        if (!embedding || embedding.length !== 1536 || !changed[index]) throw new Error(`Embedding length was invalid for ${sourceType}:${sourceId}`);
        embeddings.set(changed[index].id, embedding);
      }
    }
    if (changed.length || plan.obsoleteIds.length) await dependencies.write(changed.map((document) => ({ ...document, sourceType, sourceId, chunkIndex: document.documentIndex, embedding: embeddings.get(document.id)!, embeddingModel: model, embeddedAt: new Date() })), plan.obsoleteIds);
    return { created: plan.current.filter((document) => document.expectedAction === "create").length, changed: plan.current.filter((document) => document.expectedAction === "change").length, unchanged: plan.current.filter((document) => document.expectedAction === "skip").length, deleted: plan.obsoleteIds.length, preview: documents };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Indexing ${sourceType}:${sourceId} failed: ${detail}`, { cause: error });
  }
}
