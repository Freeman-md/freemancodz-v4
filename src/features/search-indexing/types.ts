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

export type IndexSourceResult = {
  created: number;
  changed: number;
  unchanged: number;
  deleted: number;
};