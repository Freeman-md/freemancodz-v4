import type { SearchIndexSourceType } from "@/contracts/search-index-source.contract";
import type { SourceRecord } from "../interfaces/source-record.repository.interface";

export type IndexableSourceType = SearchIndexSourceType;

export type IndexDocument = {
  sourceType: IndexableSourceType;
  sourceId: string;
  title: string;
  category: string;
  url: string;
  keywords: string[];
  paragraphs: string[];
};

export function mapSourceDocument(_source: SourceRecord): IndexDocument {
  throw new Error(
    "Portfolio source-document mapping is unavailable until the deferred search-index milestone.",
  );
}
