import type { Prisma } from "@/generated/prisma/client";
import type { OpenAIResponseTool } from "@/server/infrastructure/openai/models/openai-response-request";

export const WORKFLOW_INSTANCE_STATUSES = ["active", "completed", "cancelled"] as const;

export type WorkflowInstanceStatus = (typeof WORKFLOW_INSTANCE_STATUSES)[number];

export type WorkflowStartContext = {
  originChannel: string;
  originPage: string | null;
  originEntry: string | null;
};

export type WorkflowPublicInstance = {
  id: string;
  workflowId: string;
  workflowVersion: number;
  status: WorkflowInstanceStatus;
};

export type CreateWorkflowInstanceInput = WorkflowStartContext & {
  workflowId: string;
  workflowVersion: number;
  state: Prisma.JsonObject;
};

export type SaveWorkflowInstanceInput = {
  id: string;
  status: WorkflowInstanceStatus;
  state: Prisma.JsonObject;
  completedAt: Date | null;
};

export type WorkflowExecutionContext = {
  interactionId: string;
};

export type WorkflowExecutionResult<State extends Prisma.JsonObject> = {
  state: State;
  status: "active" | "completed";
  output: Prisma.JsonObject;
};

export type WorkflowAssistantContext = {
  instructions: string;
  tools: OpenAIResponseTool[];
  instance: WorkflowPublicInstance | null;
};

export type WorkflowToolCall = {
  name: string;
  rawArguments: string;
  interactionId: string;
  startContext?: WorkflowStartContext;
};

export type WorkflowToolExecutionResult = {
  output: Prisma.JsonObject;
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
