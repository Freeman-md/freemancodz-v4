import "server-only";

import { ReadableStream } from "node:stream/web";

import type { AssistantStreamEvent } from "@/contracts/assistant.contract";
import type { Logger } from "@/infrastructure/logging/logger";
import type { OpenAITransport } from "@/infrastructure/openai/types";
import { FALLBACK_ANSWER, PLAIN_CHAT_SYSTEM_PROMPT } from "./constants";
import type { AssistantResponseInput } from "./types";

const encoder = new TextEncoder();

function encodeEvent(event: AssistantStreamEvent) {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

export class AssistantService {
  constructor(
    private readonly openai: OpenAITransport,
    private readonly logger: Logger,
  ) {}

  createResponse(request: Extract<AssistantResponseInput, { message: string }>) {
    // NextResponse uses the DOM declarations for the same Web Streams API.
    return ReadableStream.from(this.streamReply(request)) as globalThis.ReadableStream<Uint8Array>;
  }

  private async *streamReply({
    message,
    previousResponseId,
    signal,
  }: Extract<AssistantResponseInput, { message: string }>) {
    let hasText = false;

    try {
      signal.throwIfAborted();

      const events = await this.openai.streamResponse({
        input: [{ type: "user_message", content: message }],
        instructions: PLAIN_CHAT_SYSTEM_PROMPT,
        tools: [],
        previousResponseId,
        signal,
      });

      providerEvents: for await (const event of events) {
        signal.throwIfAborted();

        switch (event.type) {
          case "response.output_text.delta":
            hasText = hasText || event.delta.trim().length > 0;
            yield encodeEvent({ type: "delta", delta: event.delta });
            break;

          case "response.completed":
            if (!hasText) {
              yield encodeEvent({ type: "delta", delta: FALLBACK_ANSWER });
            }

            yield encodeEvent({ type: "response_id", responseId: event.response.id });
            yield encodeEvent({ type: "done" });

            return;

          case "response.failed":
          case "response.incomplete":
          case "error":
            break providerEvents;
        }
      }

      throw new Error("The model response did not complete.");
    } catch {
      if (!signal.aborted) {
        this.logger.error("assistant.response_failed");
        yield encodeEvent({
          type: "error",
          error: "The assistant could not respond. Please try again.",
        });
      }
    }
  }
}
