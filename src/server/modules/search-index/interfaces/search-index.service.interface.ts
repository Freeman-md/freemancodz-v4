import type { IndexSourceInput } from "../schemas/index-source-input.schema";
import type {
  IndexWorkerBatchResult,
  SearchIndexJobStatusSummary,
} from "./search-index-job.repository.interface";
import type { IndexDocument } from "../mappers/source-document.mapper";
import type { PreparedSiteChunk } from "../chunking/text-chunker";
export type IndexSourceResult = {
  created: number;
  changed: number;
  unchanged: number;
  deleted: number;
};
export type RebuildSummary = {
  sourceRecords: number;
  sourcesIndexed: number;
  sourcesSkipped: number;
  chunksCreated: number;
  embeddingsGenerated: number;
  sourcesFailed: number;
};

export interface ISearchIndexService {
  indexSource(input: IndexSourceInput): Promise<IndexSourceResult>;
  removeSource(input: IndexSourceInput): Promise<IndexSourceResult>;
  preview(input: IndexSourceInput): Promise<{
    input: IndexSourceInput;
    document: IndexDocument;
    chunks: PreparedSiteChunk[];
    expectedAction: "unchanged" | "replace";
  }>;
  rebuild(options?: { clean?: boolean }): Promise<{
    summary: RebuildSummary;
    results: Array<{ sourceType: string; sourceId: string; result: IndexSourceResult }>;
  }>;
  getJobStatus(): Promise<SearchIndexJobStatusSummary>;
  processPendingJobs(limit?: number): Promise<IndexWorkerBatchResult>;
}
