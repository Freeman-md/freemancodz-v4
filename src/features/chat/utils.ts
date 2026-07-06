import { createElement, type ReactNode } from "react";
import {
  MAX_HISTORY_MESSAGE_LENGTH,
  MAX_HISTORY_MESSAGES,
} from "./constants";
import type { ChatHistoryMessage, ChatMessage } from "./types";

export function isExternalUrl(url: string) {
  return /^https?:\/\//.test(url);
}

export function createUserMessage(content: string): ChatMessage {
  return {
    id: `user-${Date.now()}`,
    role: "user",
    content,
  };
}

export function createAssistantMessage(content: string, sources: ChatMessage["sources"] = []): ChatMessage {
  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content,
    sources,
  };
}

export function createAssistantErrorMessage(
  content = "I couldn’t complete that request right now. Please try again.",
): ChatMessage {
  return {
    id: `assistant-error-${Date.now()}`,
    role: "assistant",
    content,
    error: true,
  };
}

export function buildChatHistory(messages: ChatMessage[]): ChatHistoryMessage[] {
  return messages
    .filter((message) => !message.error && message.content.trim().length > 0)
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_HISTORY_MESSAGE_LENGTH),
    }));
}

function getSafeHref(href: string) {
  if (/^(https?:\/\/|mailto:|\/)/.test(href)) {
    return href;
  }

  return "#";
}

function renderInlineContent(content: string) {
  const parts = content.split(/(\*\*[^*]+?\*\*|`[^`]+?`|\[[^\]]+?\]\([^)]+?\)|_[^_]+?_|(?<!\*)\*[^*]+?\*(?!\*))/g);

  return parts.map((part, index) => {
    const key = `${part}-${index}`;

    if (part.startsWith("**") && part.endsWith("**")) {
      return createElement(
        "strong",
        { key, className: "font-semibold" },
        part.slice(2, -2),
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return createElement(
        "code",
        {
          key,
          className:
            "rounded bg-black/[0.06] px-1 py-0.5 font-mono text-[0.92em]",
        },
        part.slice(1, -1),
      );
    }

    const linkMatch = part.match(/^\[([^\]]+?)\]\(([^)]+?)\)$/);

    if (linkMatch) {
      const href = getSafeHref(linkMatch[2]);

      return createElement(
        "a",
        {
          key,
          href,
          target: href.startsWith("http") ? "_blank" : undefined,
          rel: href.startsWith("http") ? "noreferrer" : undefined,
          className: "font-medium underline decoration-black/25 underline-offset-4",
        },
        linkMatch[1],
      );
    }

    if (
      (part.startsWith("*") && part.endsWith("*")) ||
      (part.startsWith("_") && part.endsWith("_"))
    ) {
      return createElement("em", { key, className: "italic" }, part.slice(1, -1));
    }

    return part;
  });
}

export function renderMessageContent(content: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  const lines = content.split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);

    if (headingMatch) {
      blocks.push(
        createElement(
          "p",
          {
            key: `heading-${index}`,
            className: "mt-3 first:mt-0 font-semibold",
          },
          renderInlineContent(headingMatch[2]),
        ),
      );
      index += 1;
      continue;
    }

    const unorderedItems: string[] = [];

    while (index < lines.length) {
      const itemMatch = lines[index].trim().match(/^[-*]\s+(.+)$/);

      if (!itemMatch) {
        break;
      }

      unorderedItems.push(itemMatch[1]);
      index += 1;
    }

    if (unorderedItems.length > 0) {
      blocks.push(
        createElement(
          "ul",
          {
            key: `ul-${index}`,
            className: "my-2 list-disc space-y-1 pl-4",
          },
          unorderedItems.map((item, itemIndex) =>
            createElement(
              "li",
              { key: `${item}-${itemIndex}`, className: "pl-1" },
              renderInlineContent(item),
            ),
          ),
        ),
      );
      continue;
    }

    const orderedItems: string[] = [];

    while (index < lines.length) {
      const itemMatch = lines[index].trim().match(/^\d+\.\s+(.+)$/);

      if (!itemMatch) {
        break;
      }

      orderedItems.push(itemMatch[1]);
      index += 1;
    }

    if (orderedItems.length > 0) {
      blocks.push(
        createElement(
          "ol",
          {
            key: `ol-${index}`,
            className: "my-2 list-decimal space-y-1 pl-4",
          },
          orderedItems.map((item, itemIndex) =>
            createElement(
              "li",
              { key: `${item}-${itemIndex}`, className: "pl-1" },
              renderInlineContent(item),
            ),
          ),
        ),
      );
      continue;
    }

    const paragraphLines = [trimmedLine];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index].trim();

      if (
        !nextLine ||
        /^(#{1,3})\s+/.test(nextLine) ||
        /^[-*]\s+/.test(nextLine) ||
        /^\d+\.\s+/.test(nextLine)
      ) {
        break;
      }

      paragraphLines.push(nextLine);
      index += 1;
    }

    blocks.push(
      createElement(
        "p",
        { key: `p-${index}`, className: "mb-2 last:mb-0" },
        renderInlineContent(paragraphLines.join("\n")),
      ),
    );
  }

  return blocks;
}
