import type {
  ExistingSiteChunk,
  IndexableSourceType,
  MatchSiteChunksRow,
  ReplaceIndexedSourceInput,
} from "../models/search-index";
export interface ISiteChunkRepository {
  findBySource(sourceType: IndexableSourceType, sourceId: string): Promise<ExistingSiteChunk[]>;
  replaceSource(input: ReplaceIndexedSourceInput): Promise<void>;
  deleteSource(sourceType: IndexableSourceType, sourceId: string): Promise<number>;
  match(
    queryEmbedding: number[],
    matchCount?: number,
    matchThreshold?: number,
  ): Promise<MatchSiteChunksRow[]>;
}
