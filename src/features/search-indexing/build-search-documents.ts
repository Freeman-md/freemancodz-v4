import {
  buildContentBlockDocuments,
  buildExperienceDocuments,
  buildPrincipleDocuments,
  buildProjectDocuments,
  buildServiceDocuments,
} from "@/features/search-indexing/builders";
import type {
  IndexableSource,
  SearchDocument,
} from "@/features/search-indexing/types";

export function buildSearchDocuments(
  source: IndexableSource,
): SearchDocument[] {
  switch (source.sourceType) {
    case "content_blocks":
      return buildContentBlockDocuments(source.record);

    case "projects":
      return buildProjectDocuments(source.record);

    case "services":
      return buildServiceDocuments(source.record);

    case "principles":
      return buildPrincipleDocuments(source.record);

    case "experiences":
      return buildExperienceDocuments(source.record);
  }
}