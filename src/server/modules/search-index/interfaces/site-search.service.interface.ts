import type { MatchSiteChunksRow } from "./site-chunk.repository.interface";
export interface ISiteSearchService {
  search(queryEmbedding: number[]): Promise<MatchSiteChunksRow[]>;
}
