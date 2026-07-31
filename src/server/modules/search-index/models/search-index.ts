import type {
  ContentBlock,
  Experience,
  Principle,
  Project,
  Service,
  SiteChunk,
} from "@/generated/prisma/client";

export type MatchSiteChunksRow = {
  id: string;
  title: string;
  url: string;
  content: string;
  category: string;
  keywords: string[];
  similarity: number;
};

export type IndexableSourceType =
  | "content_blocks"
  | "projects"
  | "services"
  | "principles"
  | "experiences";

export type SearchIndexJobOperation = "upsert" | "delete";

export type SearchIndexJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type SearchIndexJob = {
  id: string;
  operation: SearchIndexJobOperation;
  sourceType: IndexableSourceType;
  sourceId: string;
  status: SearchIndexJobStatus;
  attempts: number;
  availableAt: Date;
  claimedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  processedAt: Date | null;
};

export type EnqueueIndexJobInput = Pick<
  SearchIndexJob,
  "operation" | "sourceType" | "sourceId"
>;

export type FailIndexJobOptions = {
  maxAttempts?: number;
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

export type IndexableSource =
  | {
    sourceType: "content_blocks";
    record: ContentBlock;
  }
  | {
    sourceType: "projects";
    record: Project;
  }
  | {
    sourceType: "services";
    record: Service;
  }
  | {
    sourceType: "principles";
    record: Principle;
  }
  | {
    sourceType: "experiences";
    record: Experience;
  };

type SearchDocumentContent = Pick<
  SiteChunk,
  "title" | "category" | "url" | "content" | "keywords"
>;

export type SearchDocument = SearchDocumentContent & {
  sourceType: IndexableSourceType;
  sourceId: string;
  documentIndex: number;
};

export type PreparedSiteChunk = SearchDocument & {
  id: string;
  chunkIndex: number;
  embeddingInput: string;
  contentHash: string;
};

export type ExistingSiteChunk =  Pick<SiteChunk, "id" | "sourceType" | "sourceId" | "chunkIndex" | "contentHash" | "embeddingModel">;

export type EmbeddedSiteChunk = PreparedSiteChunk & {
  embedding: number[];
  embeddingModel: string;
  embeddedAt: Date;
};

export type ReplaceIndexedSourceInput = {
  sourceType: IndexableSourceType;
  sourceId: string;
  upserts: EmbeddedSiteChunk[];
  obsoleteIds: string[];
};

export type IndexSourceResult = {
  created: number;
  changed: number;
  unchanged: number;
  deleted: number;
};

export type IndexWorkerBatchResult = { claimed: number; completed: number; retried: number; failed: number };
