import type { AssistantStreamEvent } from "@/contracts/assistant.contract";
import type { MatchSiteChunksRow } from "@/server/modules/search-index/public";

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
