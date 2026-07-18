import "server-only";
import { deleteSourceChunks } from "../data/site-chunk.repository";
import type { IndexableSourceType } from "../types";
import { removeIndexedSourceCore } from "./remove-indexed-source.core";
export { removeIndexedSourceCore } from "./remove-indexed-source.core";

type SourceChunkRemover = (sourceType: IndexableSourceType, sourceId: string) => PromiseLike<{ count: number }>;

export async function removeIndexedSource({ sourceType, sourceId }: { sourceType: IndexableSourceType; sourceId: string }, remove: SourceChunkRemover = deleteSourceChunks) {
  return removeIndexedSourceCore({ sourceType, sourceId }, remove);
}
