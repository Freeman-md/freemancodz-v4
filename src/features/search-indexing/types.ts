import type {
  ContentBlock,
  Experience,
  Principle,
  Project,
  Service,
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