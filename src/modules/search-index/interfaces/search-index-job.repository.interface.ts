import type { SearchIndexJob, SearchIndexJobClaimResult } from "../models/search-index-job";

export interface ISearchIndexJobRepository {
  requestRebuild(): Promise<void>;
  claim(): Promise<SearchIndexJobClaimResult>;
  complete(claimedAt: Date): Promise<SearchIndexJob | null>;
  fail(claimedAt: Date, safeErrorSummary: string): Promise<SearchIndexJob | null>;
}
