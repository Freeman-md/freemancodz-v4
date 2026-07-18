import { createHash } from "node:crypto";
import type { SearchDocument } from "./types";

export function normalizeKeywords(keywords: string[]) {
  const seen = new Set<string>();
  return keywords.flatMap((keyword) => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return [];
    seen.add(normalized);
    return [normalized];
  });
}

export function formatEmbeddingInput(document: SearchDocument) {
  const keywords = normalizeKeywords(document.keywords);
  return [
    `Title: ${document.title}`,
    `Category: ${document.category}`,
    `Keywords: ${keywords.join(", ")}`,
    `Content: ${document.content}`,
  ].join("\n");
}

export function hashEmbeddingInput(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function chunkId(document: Pick<SearchDocument, "sourceType" | "sourceId" | "documentIndex">) {
  return `${document.sourceType}:${document.sourceId}:${document.documentIndex}`;
}
