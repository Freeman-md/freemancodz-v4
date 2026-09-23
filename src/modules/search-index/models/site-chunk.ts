import type { IndexDocument } from "./index-document";

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
