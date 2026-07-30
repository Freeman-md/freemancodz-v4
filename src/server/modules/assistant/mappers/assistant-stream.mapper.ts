import type { AssistantStreamEvent } from "@/contracts/assistant.contract";
import type { MatchSiteChunksRow } from "@/server/modules/search-index/models/search-index.model";

export function formatContext(chunks: MatchSiteChunksRow[]) {
  return chunks
    .map((chunk, index) =>
      [
        `Source ${index + 1}`,
        `ID: ${chunk.id}`,
        `Title: ${chunk.title}`,
        `Category: ${chunk.category}`,
        `URL: ${chunk.url}`,
        `Keywords: ${chunk.keywords.join(", ")}`,
        `Content: ${chunk.content}`,
      ].join("\n"),
    )
    .join("\n\n");
}

export function encodeStreamEvent(event: AssistantStreamEvent) {
  return `${JSON.stringify(event)}\n`;
}

export function normalizePreviousResponseId(input: unknown) {
  if (typeof input !== "string") {
    return null;
  }

  const responseId = input.trim();

  if (!responseId || responseId.length > 200 || !responseId.startsWith("resp_")) {
    return null;
  }

  return responseId;
}
