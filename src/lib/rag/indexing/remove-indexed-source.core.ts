import type { IndexableSourceType } from "../types";

export async function removeIndexedSourceCore(
  { sourceType, sourceId }: { sourceType: IndexableSourceType; sourceId: string },
  remove: (sourceType: IndexableSourceType, sourceId: string) => PromiseLike<{ count: number }>,
) {
  const result = await remove(sourceType, sourceId);
  return { deleted: result.count };
}
