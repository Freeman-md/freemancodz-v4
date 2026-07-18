export type IndexableSourceType =
  | "content_blocks"
  | "projects"
  | "services"
  | "principles"
  | "experiences";

export type SearchDocument = {
  sourceType: IndexableSourceType;
  sourceId: string;
  documentIndex: number;
  title: string;
  category: string;
  url: string;
  content: string;
  keywords: string[];
};

export type IndexingJob =
  | { operation: "upsert"; sourceType: IndexableSourceType; sourceId: string }
  | { operation: "delete"; sourceType: IndexableSourceType; sourceId: string };

export type MatchSiteChunksRow = {
  id: string;
  title: string;
  category: string;
  url: string;
  content: string;
  keywords: string[];
  similarity: number;
};
