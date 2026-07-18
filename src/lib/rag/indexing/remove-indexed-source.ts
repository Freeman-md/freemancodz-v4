import "server-only";
import { deleteSourceChunks } from "../data/site-chunk.repository";
import type { IndexableSourceType } from "../types";

export async function removeIndexedSource({ sourceType, sourceId }: { sourceType: IndexableSourceType; sourceId: string }) {
  const result = await deleteSourceChunks(sourceType, sourceId);
  return { deleted: result.count };
}
