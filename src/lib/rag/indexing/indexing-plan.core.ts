import type { SearchDocument } from "../types";

export type PreparedDocument = SearchDocument & { id: string; input: string; contentHash: string };
export type StoredIndexChunk = { id: string; contentHash: string | null; embeddingModel: string | null };
export type PlannedDocument = PreparedDocument & { expectedAction: "create" | "change" | "skip" };
export type IndexingPlan = { current: PlannedDocument[]; obsoleteIds: string[] };

export function planIndexing(documents: PreparedDocument[], existing: StoredIndexChunk[], model: string): IndexingPlan {
  const existingById = new Map(existing.map((chunk) => [chunk.id, chunk]));
  const current = documents.map((document) => {
    const previous = existingById.get(document.id);
    return { ...document, expectedAction: !previous ? "create" as const : previous.contentHash === document.contentHash && previous.embeddingModel === model ? "skip" as const : "change" as const };
  });
  return { current, obsoleteIds: existing.filter((chunk) => !documents.some((document) => document.id === chunk.id)).map((chunk) => chunk.id) };
}
