import "server-only";

import type { AssistantStreamEvent } from "@/contracts/assistant.contract";
import type { Logger } from "@/infrastructure/logging/logger";
import type { OpenAITransport } from "@/infrastructure/openai/types";
import { FALLBACK_ANSWER, PLAIN_CHAT_SYSTEM_PROMPT } from "./constants";
import type { AssistantResponseInput } from "./types";

const encoder = new TextEncoder();

export class AssistantService {
  constructor(
    private readonly openai: OpenAITransport,
    private readonly logger: Logger,
  ) {}

  createResponse(request: Extract<AssistantResponseInput, { message: string }>) {
    const { signal } = request;

    let readerCancelled = false;

    return new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const sendEvent = (event: AssistantStreamEvent) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };

        let hasText = false;

        try {
          signal.throwIfAborted();

          const events = await this.openai.streamResponse({
            input: [{ type: "user_message", content: request.message }],
            instructions: PLAIN_CHAT_SYSTEM_PROMPT,
            tools: [],
            previousResponseId: request.previousResponseId,
            signal,
          });

          providerEvents: for await (const event of events) {
            if (readerCancelled) {
              return;
            }

            signal.throwIfAborted();

            switch (event.type) {
              case "response.output_text.delta":
                hasText = hasText || event.delta.trim().length > 0;
                sendEvent({ type: "delta", delta: event.delta });
                break;

              case "response.completed":
                if (!hasText) {
                  sendEvent({ type: "delta", delta: FALLBACK_ANSWER });
                }

                sendEvent({ type: "response_id", responseId: event.response.id });
                sendEvent({ type: "done" });

                return;

              case "response.failed":
              case "response.incomplete":
              case "error":
                break providerEvents;
            }
          }

          throw new Error("The model response did not complete.");
        } catch {
          if (!signal.aborted && !readerCancelled) {
            this.logger.error("assistant.response_failed");
            sendEvent({
              type: "error",
              error: "The assistant could not respond. Please try again.",
            });
          }
        } finally {
          if (!readerCancelled) {
            controller.close();
          }
        }
      },
      cancel() {
        readerCancelled = true;
      },
    });
  }
}
