import type { SearchIndexWorkerResult } from "@/contracts/search-index-worker.contract";

export interface ISearchIndexService {
  processPendingJob(): Promise<SearchIndexWorkerResult>;
  requestRebuild(): Promise<void>;
}
