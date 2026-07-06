import type { ChatStreamEvent, ContextChunk } from "./types";

export function formatContext(chunks: ContextChunk[]) {
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

export function encodeStreamEvent(event: ChatStreamEvent) {
  return `${JSON.stringify(event)}\n`;
}
