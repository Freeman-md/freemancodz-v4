import type { IndexableSourceType } from "../mappers/source-document.mapper";
export type SearchIndexJob = {
  id: string;
  operation: "upsert" | "delete";
  sourceType: IndexableSourceType;
  sourceId: string;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  availableAt: Date;
  claimedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  processedAt: Date | null;
};
export type SearchIndexJobStatusSummary = {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  oldestPending: SearchIndexJob | null;
  staleProcessing: number;
  recentFailed: SearchIndexJob[];
};
export type IndexWorkerBatchResult = {
  claimed: number;
  completed: number;
  retried: number;
  failed: number;
};
export interface ISearchIndexJobRepository {
  claim(limit: number): Promise<SearchIndexJob[]>;
  complete(id: string): Promise<SearchIndexJob | null>;
  fail(
    id: string,
    error: unknown,
    options?: { maxAttempts?: number },
  ): Promise<SearchIndexJob | null>;
  getStatus(): Promise<SearchIndexJobStatusSummary>;
  clear(): Promise<void>;
}
