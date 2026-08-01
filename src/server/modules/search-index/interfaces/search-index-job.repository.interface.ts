import type {
  EnqueueIndexJobInput,
  FailIndexJobOptions,
  SearchIndexJob,
  SearchIndexJobStatusSummary,
} from "../models/search-index";
export interface ISearchIndexJobRepository {
  enqueue(input: EnqueueIndexJobInput): Promise<SearchIndexJob>;
  claim(limit: number): Promise<SearchIndexJob[]>;
  complete(id: string): Promise<SearchIndexJob | null>;
  fail(id: string, error: unknown, options?: FailIndexJobOptions): Promise<SearchIndexJob | null>;
  getStatus(): Promise<SearchIndexJobStatusSummary>;
}
