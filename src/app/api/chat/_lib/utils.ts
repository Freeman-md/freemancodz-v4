import {
  MAX_HISTORY_MESSAGE_LENGTH,
  MAX_HISTORY_MESSAGES,
  MAX_HISTORY_TOTAL_LENGTH,
} from "./constants";
import type {
  ChatHistoryMessage,
  ChatStreamEvent,
  ContextChunk,
} from "./types";

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

export function normalizeHistory(input: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const history: ChatHistoryMessage[] = [];
  let totalLength = 0;

  for (let index = input.length - 1; index >= 0; index -= 1) {
    if (history.length >= MAX_HISTORY_MESSAGES) {
      break;
    }

    const item = input[index];

    if (!item || typeof item !== "object") {
      continue;
    }

    const role = "role" in item ? item.role : null;
    const content = "content" in item ? item.content : null;

    if (
      (role !== "user" && role !== "assistant") ||
      typeof content !== "string"
    ) {
      continue;
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      continue;
    }

    const remainingLength = MAX_HISTORY_TOTAL_LENGTH - totalLength;

    if (remainingLength <= 0) {
      break;
    }

    const normalizedContent = trimmedContent.slice(
      0,
      Math.min(MAX_HISTORY_MESSAGE_LENGTH, remainingLength),
    );

    totalLength += normalizedContent.length;
    history.unshift({
      role,
      content: normalizedContent,
    });
  }

  return history;
}

export function formatHistory(history: ChatHistoryMessage[]) {
  return history
    .map((message) => {
      const speaker = message.role === "user" ? "User" : "Assistant";
      return `${speaker}: ${message.content}`;
    })
    .join("\n\n");
}

export function buildRetrievalQuery(
  message: string,
  history: ChatHistoryMessage[],
) {
  if (history.length === 0) {
    return message;
  }

  return [
    "Recent conversation:",
    formatHistory(history),
    "",
    "Current user message:",
    message,
  ].join("\n");
}
