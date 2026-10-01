import "server-only";
import { randomUUID } from "node:crypto";
import { FALLBACK_ANSWER, MAX_TOOL_CALL_ITERATIONS } from "./constants";
import { CHAT_SYSTEM_PROMPT } from "./prompt";
import type { AssistantResponseInput } from "./types";
import { GLOBAL_ASSISTANT_TOOLS } from "./tools/definitions";
import { executeGlobalAssistantTool } from "./tools/execute";
import type { OpenAITransport } from "@/infrastructure/openai/types";
import type { OpenAIResponseInputItem } from "@/infrastructure/openai/types";
import type { SiteSearch } from "@/modules/search-index/types";
import type { Logger } from "@/infrastructure/logging/logger";
import type { AssistantSource, AssistantStreamEvent } from "@/contracts/assistant.contract";
import { START_WORKFLOW_TOOL_NAME } from "@/modules/workflow/constants";
import type { WorkflowServiceClient } from "@/modules/workflow/interfaces";
import type {
  WorkflowAssistantContext,
  WorkflowPublicInstance,
} from "@/modules/workflow/types";

export class AssistantService {
  constructor(
    private readonly openai: OpenAITransport,
    private readonly siteSearch: SiteSearch,
    private readonly logger: Logger,
    private readonly workflow: WorkflowServiceClient,
  ) {}

  createResponse({
    message,
    previousResponseId,
    workflowInstanceId,
    workflowStart,
    signal,
  }: AssistantResponseInput) {
    const encoder = new TextEncoder();

    const interactionId = randomUUID();

    return new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const write = (event: AssistantStreamEvent) =>
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

        let didStreamText = false;

        let responseId = previousResponseId;

        let activeWorkflowInstanceId = workflowInstanceId;

        let latestWorkflowInstance: WorkflowPublicInstance | null = null;

        let workflowEndedThisInteraction = false;

        const sources = new Map<string, AssistantSource>();

        let input: OpenAIResponseInputItem[] = [{ type: "user_message", content: message }];

        try {
          if (workflowStart) {
            const existingContext = activeWorkflowInstanceId
              ? await this.workflow.getAssistantContext(activeWorkflowInstanceId)
              : null;

            const activeInstance =
              existingContext?.instance?.status === "active" ? existingContext.instance : null;

            if (activeInstance && activeInstance.workflowId !== workflowStart.workflowId) {
              throw new Error("Another workflow is already active.");
            }

            if (!activeInstance) {
              const started = await this.workflow.start(workflowStart.workflowId, {
                originChannel: "web",
                originPage: workflowStart.originPage,
                originEntry: workflowStart.originEntry,
              });

              activeWorkflowInstanceId = started.id;
              latestWorkflowInstance = started;
            }
          }

          for (let iteration = 0; iteration < MAX_TOOL_CALL_ITERATIONS; iteration += 1) {
            const toolCalls: Array<{ callId: string; name: string; arguments: string }> = [];

            const workflowContext =
              await this.workflow.getAssistantContext(activeWorkflowInstanceId);

            const workflowTools = workflowEndedThisInteraction
              ? workflowContext.tools.filter(({ name }) => name !== START_WORKFLOW_TOOL_NAME)
              : workflowContext.tools;

            const workflowInstructions = workflowEndedThisInteraction
              ? "A workflow ended during this visitor interaction. Do not start another workflow until a later visitor message."
              : workflowContext.instructions;

            latestWorkflowInstance = workflowContext.instance ?? latestWorkflowInstance;

            const response = await this.openai.streamResponse({
              input,
              instructions: combineInstructions(CHAT_SYSTEM_PROMPT, workflowInstructions),
              tools: [...GLOBAL_ASSISTANT_TOOLS, ...workflowTools],
              previousResponseId: responseId,
              signal,
            });

            for await (const event of response) {
              if (signal.aborted) {
                return;
              }

              if (event.type === "response.created" || event.type === "response.completed") {
                responseId = event.response.id;
              }

              if (event.type === "response.output_text.delta" && event.delta) {
                didStreamText = true;
                write({ type: "delta", delta: event.delta });
              }

              if (
                event.type === "response.output_item.done" &&
                event.item.type === "function_call"
              ) {
                toolCalls.push({
                  callId: event.item.call_id,
                  name: event.item.name,
                  arguments: event.item.arguments,
                });
              }

              if (event.type === "error") {
                throw new Error(event.message);
              }

              if (event.type === "response.failed") {
                throw new Error(event.response.error?.message || "OpenAI response failed.");
              }
            }

            if (toolCalls.length === 0) {
              break;
            }

            if (iteration === MAX_TOOL_CALL_ITERATIONS - 1) {
              throw new Error("Assistant tool call limit exceeded.");
            }

            const toolResult = await this.executeToolCalls(
              toolCalls,
              sources,
              signal,
              activeWorkflowInstanceId,
              workflowContext,
              interactionId,
              (instance) => {
                latestWorkflowInstance = instance;
                activeWorkflowInstanceId = instance.status === "active" ? instance.id : null;
                workflowEndedThisInteraction = instance.status !== "active";
              },
            );

            activeWorkflowInstanceId = toolResult.activeWorkflowInstanceId;
            latestWorkflowInstance = toolResult.workflowInstance ?? latestWorkflowInstance;
            input = toolResult.output;
          }

          write({ type: "sources", sources: [...sources.values()] });
          if (!didStreamText) {
            write({ type: "delta", delta: FALLBACK_ANSWER });
          }

          if (responseId) {
            write({ type: "response_id", responseId });
          }

          if (latestWorkflowInstance) {
            write({ type: "workflow_instance", instance: latestWorkflowInstance });
          }

          write({ type: "done" });
        } catch (error) {
          if (!signal.aborted) {
            this.logger.error("assistant.response_failed", {
              category: "assistant_request_failed",
              workflowInstanceId: activeWorkflowInstanceId,
            });

            if (latestWorkflowInstance) {
              write({ type: "workflow_instance", instance: latestWorkflowInstance });
            }

            write({ type: "error", error: "The assistant could not respond. Please try again." });
          }
        } finally {
          controller.close();
        }
      },
    });
  }

  private async executeToolCalls(
    toolCalls: Array<{ callId: string; name: string; arguments: string }>,
    sources: Map<string, AssistantSource>,
    signal: AbortSignal,
    instanceId: string | null,
    workflowContext: WorkflowAssistantContext,
    interactionId: string,
    onWorkflowTransition: (instance: WorkflowPublicInstance) => void,
  ): Promise<{
    output: OpenAIResponseInputItem[];
    activeWorkflowInstanceId: string | null;
    workflowInstance: WorkflowPublicInstance | null;
  }> {
    const outputs: OpenAIResponseInputItem[] = [];

    let activeWorkflowInstanceId = instanceId;

    let workflowInstance = workflowContext.instance;

    const availableWorkflowTools = new Set(workflowContext.tools.map(({ name }) => name));

    const globalToolNames = new Set(GLOBAL_ASSISTANT_TOOLS.map(({ name }) => name));

    for (const toolCall of toolCalls) {
      if (signal.aborted) {
        return { output: [], activeWorkflowInstanceId, workflowInstance };
      }

      if (globalToolNames.has(toolCall.name)) {
        const result = await executeGlobalAssistantTool(toolCall.name, toolCall.arguments, {
          openai: this.openai,
          siteSearch: this.siteSearch,
        });

        for (const source of result.sources) {
          sources.set(source.id, source);
        }

        outputs.push({
          type: "function_call_output",
          callId: toolCall.callId,
          output: JSON.stringify(result.output),
        });

        continue;
      }

      if (!availableWorkflowTools.has(toolCall.name)) {
        outputs.push({
          type: "function_call_output",
          callId: toolCall.callId,
          output: JSON.stringify({
            error: "unknown_tool",
            message: "The requested tool is not available in the current workflow step.",
          }),
        });

        continue;
      }

      const result = await this.workflow.executeTool(activeWorkflowInstanceId, {
        name: toolCall.name,
        rawArguments: toolCall.arguments,
        interactionId,
        startContext: activeWorkflowInstanceId
          ? undefined
          : { originChannel: "web", originPage: null, originEntry: null },
      });

      workflowInstance = result.instance;
      activeWorkflowInstanceId = result.instance.status === "active" ? result.instance.id : null;
      onWorkflowTransition(result.instance);

      outputs.push({
        type: "function_call_output",
        callId: toolCall.callId,
        output: JSON.stringify(result.output),
      });
    }

    return { output: outputs, activeWorkflowInstanceId, workflowInstance };
  }
}

function combineInstructions(base: string, workflowInstructions: string) {
  return workflowInstructions ? `${base}\n\n${workflowInstructions}` : base;
}
