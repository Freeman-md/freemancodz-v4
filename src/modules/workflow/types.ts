import type { Prisma } from "@/generated/prisma/client";
import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import type { WorkflowProgress } from "@/contracts/workflow-progress.contract";
import type { AssistantInteraction } from "@/contracts/assistant-ui.contract";

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
  progress: WorkflowProgress;
};

export type CreateWorkflowInstanceInput = WorkflowStartContext & {
  workflowId: string;
  workflowVersion: number;
  state: Prisma.JsonObject;
};

export type SaveWorkflowInstanceInput = {
  id: string;
  expectedRevision: number;
  pendingInteraction?: Prisma.JsonObject;
  replacement?: CreateWorkflowInstanceInput;
  status: WorkflowInstanceStatus;
  state: Prisma.JsonObject;
  completedAt: Date | null;
};

export type WorkflowExecutionContext = {
  workflowInstanceId: string;
  interactionId: string;
  allowConfirmation?: boolean;
};

export type WorkflowExecutionResult<State extends Prisma.JsonObject> = {
  state: State;
  status: "active" | "completed";
  output: Prisma.JsonObject;
};

export type WorkflowAssistantContext = {
  instructions: string;
  pendingWorkflowTargetId?: string;
  inputFields?: Array<Omit<AssistantInteraction["controls"][number], "label" | "options">>;
  tools: OpenAIResponseTool[];
  instance: WorkflowPublicInstance | null;
};

export type WorkflowToolCall = {
  name: string;
  rawArguments: string;
  interactionId: string;
  allowConfirmation?: boolean;
  startContext?: WorkflowStartContext;
};

export type WorkflowToolExecutionResult = {
  output: Prisma.JsonObject;
  instance: WorkflowPublicInstance;
};
