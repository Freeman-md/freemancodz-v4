import type { IndexSourceInput } from "../schemas/index-source-input.schema";
import type {
  IndexSourceResult,
  MatchSiteChunksRow,
  SearchIndexJobStatusSummary,
} from "../models/search-index";

export interface ISearchIndexService {
  search(queryEmbedding: number[]): Promise<MatchSiteChunksRow[]>;
  indexSource(input: IndexSourceInput): Promise<IndexSourceResult>;
  removeSource(input: IndexSourceInput): Promise<IndexSourceResult>;
  preview(input: IndexSourceInput): Promise<{
    input: IndexSourceInput;
    chunks: Array<Record<string, unknown>>;
    obsoleteIds: string[];
  }>;
  rebuild(): Promise<{
    totals: IndexSourceResult;
    results: Array<{ sourceType: string; sourceId: string; result: IndexSourceResult }>;
  }>;
  getJobStatus(): Promise<SearchIndexJobStatusSummary>;
}
