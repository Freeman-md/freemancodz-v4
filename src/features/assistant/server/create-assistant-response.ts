import "server-only";

import { createOpenAIClient, getResponseModel } from "@/lib/openai";
import { FALLBACK_ANSWER } from "./chat-stream-constants";
import { CHAT_SYSTEM_PROMPT } from "./prompt";
import { retrieveContext } from "./retrieve-context";
import { encodeStreamEvent, formatContext } from "./stream-utils";
import type { AssistantStreamEvent } from "../schema";

export function createAssistantResponse({
  message,
  previousResponseId,
  signal,
}: {
  message: string;
  previousResponseId: string | null;
  signal: AbortSignal;
}) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (event: AssistantStreamEvent) => controller.enqueue(encoder.encode(encodeStreamEvent(event)));
      let didStreamText = false;
      let responseId: string | null = null;

      try {
        const { chunks, sources } = await retrieveContext(message);
        if (chunks.length === 0 && !previousResponseId) {
          write({ type: "delta", delta: FALLBACK_ANSWER });
          write({ type: "done" });
          return;
        }

        const response = await createOpenAIClient().responses.create({
          model: getResponseModel(),
          instructions: CHAT_SYSTEM_PROMPT,
          input: `Portfolio information:\n\n${chunks.length ? formatContext(chunks) : "No additional portfolio information is available for this message. Use prior conversation only if it contains enough relevant portfolio information."}\n\nCurrent user question:\n${message}`,
          previous_response_id: previousResponseId,
          store: true,
          stream: true,
        }, { signal });

        for await (const event of response) {
          if (signal.aborted) return;
          if (event.type === "response.created" || event.type === "response.completed") responseId = event.response.id;
          if (event.type === "response.output_text.delta" && event.delta) {
            didStreamText = true;
            write({ type: "delta", delta: event.delta });
          }
          if (event.type === "error") throw new Error(event.message);
          if (event.type === "response.failed") throw new Error(event.response.error?.message || "OpenAI response failed.");
        }

        write({ type: "sources", sources });
        if (!didStreamText) write({ type: "delta", delta: FALLBACK_ANSWER });
        if (responseId) write({ type: "response_id", responseId });
        write({ type: "done" });
      } catch (error) {
        if (!signal.aborted) {
          console.error("Assistant response failed", error);
          write({ type: "error", error: "The assistant could not respond. Please try again." });
        }
      } finally {
        controller.close();
      }
    },
  });
}
