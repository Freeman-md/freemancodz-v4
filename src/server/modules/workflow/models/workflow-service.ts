import type { OpenAIResponseTool } from "@/server/infrastructure/openai/models/openai-response-request";
import type { WorkflowPublicInstance, WorkflowStartContext } from "./workflow-instance";
import type { WorkflowSemanticOutput } from "./workflow-definition";

export type WorkflowAssistantContext = {
  instructions: string;
  tools: OpenAIResponseTool[];
  instance: WorkflowPublicInstance | null;
};

export type WorkflowToolCall = {
  name: string;
  rawArguments: string;
  startContext?: WorkflowStartContext;
};

export type WorkflowToolExecutionResult = {
  output: WorkflowSemanticOutput;
  instance: WorkflowPublicInstance;
};

export type WorkflowServiceErrorCode =
  | "configuration_error"
  | "execution_failed"
  | "invalid_request"
  | "invalid_state"
  | "invalid_transition"
  | "not_found"
  | "persistence_failed"
  | "unavailable_definition"
  | "unavailable_tool";

export class WorkflowServiceError extends Error {
  constructor(
    readonly code: WorkflowServiceErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "WorkflowServiceError";
  }
}
