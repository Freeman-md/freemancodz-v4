import type { PreparedSiteChunk } from "../chunking/text-chunker";
import type { IndexableSourceType } from "../mappers/source-document.mapper";
export type ExistingSiteChunk = {
  chunkIndex: number;
  contentHash: string | null;
  embeddingModel: string | null;
};
export type EmbeddedSiteChunk = PreparedSiteChunk & {
  embedding: number[];
  embeddingModel: string;
  embeddedAt: Date;
};
export type MatchSiteChunksRow = {
  id: string;
  title: string;
  url: string;
  content: string;
  category: string;
  keywords: string[];
  similarity: number;
};
export interface ISiteChunkRepository {
  findBySource(sourceType: IndexableSourceType, sourceId: string): Promise<ExistingSiteChunk[]>;
  replaceSource(
    sourceType: IndexableSourceType,
    sourceId: string,
    chunks: EmbeddedSiteChunk[],
  ): Promise<void>;
  deleteSource(sourceType: IndexableSourceType, sourceId: string): Promise<number>;
  match(
    queryEmbedding: number[],
    matchCount?: number,
    matchThreshold?: number,
  ): Promise<MatchSiteChunksRow[]>;
  clear(): Promise<void>;
}
