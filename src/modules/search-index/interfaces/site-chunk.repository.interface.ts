import type { EmbeddedSiteChunk } from "../models/site-chunk";
import type { SiteSearchResult } from "../models/site-search-result";

export interface ISiteChunkRepository {
  replacePortfolioSnapshot(chunks: EmbeddedSiteChunk[], claimedAt: Date): Promise<void>;
  match(
    queryEmbedding: number[],
    matchCount?: number,
    matchThreshold?: number,
  ): Promise<SiteSearchResult[]>;
}
