export type PortfolioIndexSourceType = "profile" | "content_block" | "project" | "experience";

export type IndexDocument = {
  sourceType: PortfolioIndexSourceType;
  sourceId: string;
  title: string;
  category: string;
  url: string;
  keywords: string[];
  paragraphs: string[];
};

export type SearchIndexJobStatus = "pending" | "processing" | "completed" | "failed";

export type SearchIndexJob = {
  jobKey: "portfolio";
  status: SearchIndexJobStatus;
  rerunRequested: boolean;
  attempts: number;
  availableAt: Date;
  requestedAt: Date;
  claimedAt: Date | null;
  processedAt: Date | null;
  lastError: string | null;
};

export type ClaimedSearchIndexJob = Omit<SearchIndexJob, "status" | "claimedAt"> & {
  status: "processing";
  claimedAt: Date;
};

export type SearchIndexJobClaimResult = {
  job: ClaimedSearchIndexJob | null;
  staleJobRecovered: boolean;
};

export type PreparedSiteChunk = {
  id: string;
  sourceType: IndexDocument["sourceType"];
  sourceId: string;
  chunkIndex: number;
  title: string;
  category: string;
  url: string;
  keywords: string[];
  content: string;
  embeddingInput: string;
  contentHash: string;
};

export type EmbeddedSiteChunk = PreparedSiteChunk & {
  embedding: number[];
  embeddingModel: string;
  embeddedAt: Date;
};

export type SiteSearchResult = {
  id: string;
  title: string;
  url: string;
  content: string;
  category: string;
  keywords: string[];
  similarity: number;
};

export type SearchIndexJobStore = {
  requestRebuild(): Promise<void>;
  claim(): Promise<SearchIndexJobClaimResult>;
  complete(claimedAt: Date): Promise<SearchIndexJob | null>;
  fail(claimedAt: Date, safeErrorSummary: string): Promise<SearchIndexJob | null>;
};

export type SiteChunkStore = {
  replacePortfolioSnapshot(chunks: EmbeddedSiteChunk[], claimedAt: Date): Promise<void>;
  match(
    queryEmbedding: number[],
    matchCount?: number,
    matchThreshold?: number,
  ): Promise<SiteSearchResult[]>;
};

export type SiteSearch = {
  search(queryEmbedding: number[]): Promise<SiteSearchResult[]>;
};
