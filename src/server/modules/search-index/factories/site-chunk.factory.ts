import { createHash } from "node:crypto";

import type {
  PreparedSiteChunk,
  SearchDocument,
} from "@/server/modules/search-index/models/search-index";

function normalizeKeywords(keywords: string[]): string[] {
  return [...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right),
  );
}

export function prepareSiteChunk(document: SearchDocument): PreparedSiteChunk {
  const keywords = normalizeKeywords(document.keywords);

  const embeddingInput = [
    `Title: ${document.title}`,
    `Category: ${document.category}`,
    `Keywords: ${keywords.join(", ")}`,
    `Content: ${document.content}`,
  ].join("\n");

  const contentHash = createHash("sha256").update(embeddingInput).digest("hex");

  return {
    ...document,
    id: `${document.sourceType}:${document.sourceId}:${document.documentIndex}`,
    chunkIndex: document.documentIndex,
    keywords,
    embeddingInput,
    contentHash,
  };
}
