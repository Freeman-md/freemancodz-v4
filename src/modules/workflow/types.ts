import type { Prisma } from "@/generated/prisma/client";
import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import type { WorkflowPublicInstance } from "@/contracts/assistant.contract";
export type { WorkflowPublicInstance } from "@/contracts/assistant.contract";

export const WORKFLOW_INSTANCE_STATUSES = ["active", "completed", "cancelled"] as const;

export type WorkflowInstanceStatus = (typeof WORKFLOW_INSTANCE_STATUSES)[number];

export type WorkflowStartContext = {
  originChannel: string;
  originPage: string | null;
  originEntry: string | null;
};

export type CreateWorkflowInstanceInput = WorkflowStartContext & {
  workflowId: string;
  workflowVersion: number;
  state: Prisma.JsonObject;
};

export type SaveWorkflowInstanceInput = {
  id: string;
  expectedRevision: number;
  replacement?: CreateWorkflowInstanceInput;
  status: WorkflowInstanceStatus;
  state: Prisma.JsonObject;
  completedAt: Date | null;
};

export type WorkflowExecutionContext = {
  workflowInstanceId: string;
  interactionId: string;
  allowConfirmation?: boolean;
  expectedRevision?: number;
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
  allowConfirmation?: boolean;
  expectedRevision?: number;
  startContext?: WorkflowStartContext;
};

export type WorkflowToolExecutionResult = {
  output: Prisma.JsonObject;
  instance: WorkflowPublicInstance;
};
