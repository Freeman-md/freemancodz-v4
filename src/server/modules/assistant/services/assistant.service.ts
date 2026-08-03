import "server-only";
import {
  DAILY_RATE_LIMIT_MAX,
  DAILY_RATE_LIMIT_WINDOW_MS,
  FALLBACK_ANSWER,
  MAX_TOOL_CALL_ITERATIONS,
  SHORT_RATE_LIMIT_MAX,
  SHORT_RATE_LIMIT_WINDOW_MS,
} from "../assistant.constants";
import type {
  AssistantRateLimitResult,
  AssistantResponseInput,
  IAssistantService,
} from "../interfaces/assistant.service.interface";
import { encodeStreamEvent } from "../mappers/assistant-stream.mapper";
import { CHAT_SYSTEM_PROMPT } from "../prompts/portfolio-assistant.prompt";
import { ASSISTANT_TOOLS } from "../tools/assistant-tools";
import { executeAssistantTool } from "../tools/execute-assistant-tool";
import type { IOpenAIProvider } from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import type { OpenAIResponseInputItem } from "@/server/infrastructure/openai/models/openai-response-request";
import type { ISiteSearchService } from "@/server/modules/search-index/public";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type { AssistantSource, AssistantStreamEvent } from "@/contracts/assistant.contract";
import type { IMeetingService } from "@/server/modules/meeting/public";
import { MeetingWorkflowService } from "../workflow/meeting-workflow.service";
type WindowCounter = { count: number; resetAt: number };

export class AssistantService implements IAssistantService {
  private readonly shortCounters = new Map<string, WindowCounter>();

  private readonly dailyCounters = new Map<string, WindowCounter>();

  constructor(
    private readonly openai: IOpenAIProvider,
    private readonly siteSearch: ISiteSearchService,
    private readonly logger: ILogger,
    private readonly meetingService: IMeetingService,
    private readonly workflow: MeetingWorkflowService,
  ) {}

  checkRateLimit(clientIdentifier: string): AssistantRateLimitResult {
    const now = Date.now();

    this.prune(this.shortCounters, now);
    this.prune(this.dailyCounters, now);
    const short = this.counter(
      this.shortCounters,
      clientIdentifier,
      now,
      SHORT_RATE_LIMIT_WINDOW_MS,
    );

    const daily = this.counter(
      this.dailyCounters,
      clientIdentifier,
      now,
      DAILY_RATE_LIMIT_WINDOW_MS,
    );

    if (short.count >= SHORT_RATE_LIMIT_MAX) {
      return {
        allowed: false,
        error: "Too many messages. Please try again in a few minutes.",
        limit: SHORT_RATE_LIMIT_MAX,
        remaining: 0,
        resetAt: short.resetAt,
      };
    }

    if (daily.count >= DAILY_RATE_LIMIT_MAX) {
      return {
        allowed: false,
        error: "Daily message limit reached. Please try again later.",
        limit: DAILY_RATE_LIMIT_MAX,
        remaining: 0,
        resetAt: daily.resetAt,
      };
    }

    short.count += 1;
    daily.count += 1;

    return { allowed: true };
  }

  createResponse({ message, previousResponseId, workflowToken, signal }: AssistantResponseInput) {
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const write = (event: AssistantStreamEvent) =>
          controller.enqueue(encoder.encode(encodeStreamEvent(event)));

        let didStreamText = false;

        let responseId = previousResponseId;

        let workflowState = this.workflow.recordConfirmation(this.workflow.decode(workflowToken), message);

        const sources = new Map<string, AssistantSource>();

        let input: OpenAIResponseInputItem[] = [{ type: "user_message", content: message }];

        try {
          for (let iteration = 0; iteration < MAX_TOOL_CALL_ITERATIONS; iteration += 1) {
            const toolCalls: Array<{ callId: string; name: string; arguments: string }> = [];

            const response = await this.openai.streamResponse({
              input,
              instructions: CHAT_SYSTEM_PROMPT,
              tools: ASSISTANT_TOOLS,
              previousResponseId: responseId,
              signal,
            });

            for await (const event of response) {
              if (signal.aborted) {return;}

              if (event.type === "response.created" || event.type === "response.completed") {
                responseId = event.response.id;
              }

              if (event.type === "response.output_text.delta" && event.delta) {
                didStreamText = true;
                write({ type: "delta", delta: event.delta });
              }

              if (event.type === "response.output_item.done" && event.item.type === "function_call") {
                toolCalls.push({
                  callId: event.item.call_id,
                  name: event.item.name,
                  arguments: event.item.arguments,
                });
              }

              if (event.type === "error") {throw new Error(event.message);}

              if (event.type === "response.failed") {
                throw new Error(event.response.error?.message || "OpenAI response failed.");
              }
            }

            if (toolCalls.length === 0) {break;}

            if (iteration === MAX_TOOL_CALL_ITERATIONS - 1) {
              throw new Error("Assistant tool call limit exceeded.");
            }

            const toolResult = await this.executeToolCalls(toolCalls, sources, signal, workflowState);

            workflowState = toolResult.workflowState;
            input = toolResult.output;
          }

          write({ type: "sources", sources: [...sources.values()] });
          if (!didStreamText) {
            write({ type: "delta", delta: FALLBACK_ANSWER });
          }

          if (responseId) {
            write({ type: "response_id", responseId });
          }

          write({ type: "meeting_workflow", token: this.workflow.encode(workflowState), state: this.workflow.publicState(workflowState) });

          write({ type: "done" });
        } catch (error) {
          if (!signal.aborted) {
            this.logger.error("Assistant response failed", error);
            write({ type: "error", error: "The assistant could not respond. Please try again." });
          }
        } finally {
          controller.close();
        }
      },
    });
  }

  private counter(
    counters: Map<string, WindowCounter>,
    key: string,
    now: number,
    windowMs: number,
  ) {
    const current = counters.get(key);

    if (current && current.resetAt > now) {
      return current;
    }

    const next = { count: 0, resetAt: now + windowMs };

    counters.set(key, next);

    return next;
  }

  private prune(counters: Map<string, WindowCounter>, now: number) {
    for (const [key, counter] of counters) {
      if (counter.resetAt <= now) {
        counters.delete(key);
      }
    }
  }

  private async executeToolCalls(
    toolCalls: Array<{ callId: string; name: string; arguments: string }>,
    sources: Map<string, AssistantSource>,
    signal: AbortSignal,
    state: import("../workflow/meeting-workflow.state").MeetingWorkflowState,
  ): Promise<{ output: OpenAIResponseInputItem[]; workflowState: import("../workflow/meeting-workflow.state").MeetingWorkflowState }> {
    const outputs: OpenAIResponseInputItem[] = [];

    let workflowState = state;

    for (const toolCall of toolCalls) {
      if (signal.aborted) {return { output: [], workflowState };}

      const result = await executeAssistantTool(toolCall.name, toolCall.arguments, {
        openai: this.openai,
        siteSearch: this.siteSearch,
        meetingService: this.meetingService,
        workflow: this.workflow,
        state: workflowState,
      });

      workflowState = result.state;

      for (const source of result.sources) {sources.set(source.id, source);}

      outputs.push({
        type: "function_call_output",
        callId: toolCall.callId,
        output: JSON.stringify(result.output),
      });
    }

    return { output: outputs, workflowState };
  }
}
