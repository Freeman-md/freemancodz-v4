import type { SiteSearchResult } from "../models/site-search-result";
export interface ISiteSearchService {
  search(queryEmbedding: number[]): Promise<SiteSearchResult[]>;
}
