import { buildContentBlockDocuments } from "./build-content-block-documents";
import { buildExperienceDocuments } from "./build-experience-documents";
import { buildPrincipleDocuments } from "./build-principle-documents";
import { buildProjectDocuments } from "./build-project-documents";
import { buildServiceDocuments } from "./build-service-documents";
import type {
  IndexableSource,
  SearchDocument,
} from "@/server/modules/search-index/models/search-index.model";

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
