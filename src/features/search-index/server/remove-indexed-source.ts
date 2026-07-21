import { deleteIndexedSource } from "@/features/search-index/server/data/site-chunk.repository";
import type {
  IndexableSourceType,
  IndexSourceResult,
} from "@/features/search-index/types";

type RemoveIndexedSourceInput = {
  sourceType: IndexableSourceType;
  sourceId: string;
};

type RemoveIndexedSourceDependencies = {
  deleteIndexedSource: (
    sourceType: IndexableSourceType,
    sourceId: string,
  ) => Promise<number>;
};

export function createRemoveIndexedSource({
  deleteIndexedSource,
}: RemoveIndexedSourceDependencies) {
  return async function removeIndexedSource({
    sourceType,
    sourceId,
  }: RemoveIndexedSourceInput): Promise<IndexSourceResult> {
    try {
      const deleted = await deleteIndexedSource(sourceType, sourceId);

      return {
        created: 0,
        changed: 0,
        unchanged: 0,
        deleted,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);

      throw new Error(
        `Failed to remove indexed source ${sourceType}:${sourceId}: ${detail}`,
        { cause: error },
      );
    }
  };
}

export const removeIndexedSource = createRemoveIndexedSource({
  deleteIndexedSource,
});
