import type {
  ContentBlock,
  Experience,
  Principle,
  Project,
  Service,
  SiteChunk,
} from "@/generated/prisma/client";

export type IndexableSourceType =
  | "content_blocks"
  | "projects"
  | "services"
  | "principles"
  | "experiences";

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


export type IndexSourceResult = {
  created: number;
  changed: number;
  unchanged: number;
  deleted: number;
};