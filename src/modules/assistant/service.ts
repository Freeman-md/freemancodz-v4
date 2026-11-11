import "server-only";

import { ReadableStream } from "node:stream/web";

import type { AssistantStreamEvent } from "@/contracts/assistant.contract";
import type { Logger } from "@/infrastructure/logging/logger";
import type { OpenAIResponseRequest, OpenAITransport } from "@/infrastructure/openai/types";
import { FALLBACK_ANSWER, PLAIN_CHAT_SYSTEM_PROMPT } from "./constants";
import { ASSISTANT_ERRORS, AssistantError } from "./errors";
import { ASK_USER_CHOICE_TOOL } from "./tools/ask-user-choice/definition";
import type { PortfolioSearchService } from "../portfolio/services/portfolio-search.service";
import type { WorkflowService } from "../workflow/service";
import { executeTool, type ToolReplyEvent } from "./tools/execute";
import { SEARCH_PORTFOLIO_TOOL } from "./tools/search-portfolio/definition";
import { createStartWorkflowTool } from "./tools/start-workflow/definition";
import type { AssistantResponseInput } from "./types";

const encoder = new TextEncoder();

function encodeEvent(event: AssistantStreamEvent) {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

export class AssistantService {
  constructor(
    private readonly openai: OpenAITransport,
    private readonly logger: Logger,
    private readonly portfolioSearch: Pick<PortfolioSearchService, "search">,
    private readonly workflow: Pick<WorkflowService, "listAvailable" | "start" | "getActiveTools">,
  ) {}

  createResponse(request: AssistantResponseInput) {
    // NextResponse uses the DOM declarations for the same Web Streams API.
    return ReadableStream.from(this.streamReply(request)) as globalThis.ReadableStream<Uint8Array>;
  }

  private async *streamReply({
    message,
    previousResponseId,
    visitorKey,
    signal,
  }: AssistantResponseInput) {
    const workflows = this.workflow.listAvailable();

    const tools: OpenAIResponseRequest["tools"] = [ASK_USER_CHOICE_TOOL, SEARCH_PORTFOLIO_TOOL];

    if (workflows.length > 0) {
      tools.push(createStartWorkflowTool(workflows));
    }

    let modelRequest: OpenAIResponseRequest = {
      input: [{ type: "user_message", content: message }],
      instructions: PLAIN_CHAT_SYSTEM_PROMPT,
      tools,
      previousResponseId,
      signal,
    };

    let replyEvent: ToolReplyEvent | undefined;

    try {
      signal.throwIfAborted();
      const workflowTools = await this.workflow.getActiveTools(visitorKey);

      modelRequest.tools.push(...workflowTools.map(({ tool }) => tool));

      // Only the first pass offers tools, so a reply takes at most two model requests.
      modelResponses: for (;;) {
        signal.throwIfAborted();

        const events = await this.openai.streamResponse(modelRequest);

        let hasText = false;

        for await (const event of events) {
          signal.throwIfAborted();

          switch (event.type) {
            case "response.output_text.delta":
              hasText = hasText || event.delta.trim().length > 0;
              yield encodeEvent({ type: "delta", delta: event.delta });
              break;

            case "response.completed": {
              const functionCalls = event.response.output.filter(
                (item) => item.type === "function_call",
              );

              const [functionCall] = functionCalls;

              if (functionCall) {
                if (
                  functionCalls.length !== 1 ||
                  !modelRequest.tools.some(({ name }) => name === functionCall.name)
                ) {
                  throw new Error("Unexpected assistant tool call.");
                }

                const result = await executeTool(
                  functionCall.name,
                  functionCall.arguments,
                  this.portfolioSearch,
                  signal,
                  { service: this.workflow, visitorKey, tools: workflowTools },
                );

                signal.throwIfAborted();

                if (result.event?.type === "workflow_instance") {
                  yield encodeEvent(result.event);
                } else {
                  replyEvent = result.event;
                }

                // Continue from this tool call so the model can use its result in the same turn.
                modelRequest = {
                  ...modelRequest,
                  input: [
                    {
                      type: "function_call_output",
                      callId: functionCall.call_id,
                      output: result.output,
                    },
                  ],
                  tools: [],
                  previousResponseId: event.response.id,
                };

                continue modelResponses;
              }

              if (!hasText) {
                if (modelRequest.tools.length === 0) {
                  throw new Error("Expected text after the tool result.");
                }

                yield encodeEvent({ type: "delta", delta: FALLBACK_ANSWER });
              }

              if (replyEvent) {
                yield encodeEvent(replyEvent);
              }

              yield encodeEvent({ type: "response_id", responseId: event.response.id });
              yield encodeEvent({ type: "done" });

              return;
            }

            case "response.failed":
            case "response.incomplete":
            case "error":
              throw new Error("The model response did not complete.");
          }
        }

        throw new Error("The model stream ended before completion.");
      }
    } catch (error) {
      if (signal.aborted) {
        return;
      }

      const failure =
        error instanceof AssistantError ? error.failure : ASSISTANT_ERRORS.RESPONSE_FAILED;

      this.logger.error(failure.code);
      yield encodeEvent({ type: "error", error: failure.publicMessage });
    }
  }
}
