import type { Prisma, WorkflowInstance } from "@/generated/prisma/client";
import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import type { WorkflowProgress } from "@/contracts/workflow-progress.contract";
import type { z } from "zod";
import type { WorkflowReview } from "@/contracts/assistant.contract";
import type { ApprovedExecution } from "./execution.repository";
import type {
  CreateWorkflowInstanceInput,
  SaveWorkflowInstanceInput,
  WorkflowAssistantContext,
  WorkflowExecutionContext,
  WorkflowExecutionResult,
  WorkflowPublicInstance,
  WorkflowStartContext,
  WorkflowToolCall,
  WorkflowToolExecutionResult,
} from "./types";

export interface IWorkflowDefinition<State extends Prisma.JsonObject = Prisma.JsonObject> {
  readonly id: string;
  readonly version: number;
  readonly description: string;
  readonly stateSchema: z.ZodType<State>;
  createInitialState(context: WorkflowStartContext): State;
  getProgress(state: State, status: WorkflowPublicInstance["status"]): WorkflowProgress;
  getInstructions(state: State): string;
  getTools(state: State): OpenAIResponseTool[];
  getReview?(state: State): WorkflowReview | undefined;
  prepareApproval?(
    state: State,
    executionId: string,
    revision: number,
  ): Omit<ApprovedExecution, "id" | "instanceId" | "revision"> | null;
  adoptApproval?(
    state: State,
    executionId: string,
  ): Omit<ApprovedExecution, "id" | "instanceId" | "revision"> | null;
  executeTool(
    name: string,
    rawArguments: string,
    state: State,
    context: WorkflowExecutionContext,
  ): Promise<WorkflowExecutionResult<State>>;
}

export interface IWorkflowProgressProjector<State extends Prisma.JsonObject> {
  getProgress(state: State, status: WorkflowPublicInstance["status"]): WorkflowProgress;
  getMissingRequiredFields(state: State): string[];
}

export interface IWorkflowInstanceRepository {
  create(input: CreateWorkflowInstanceInput): Promise<WorkflowInstance>;
  findById(id: string): Promise<WorkflowInstance | null>;
  save(input: SaveWorkflowInstanceInput): Promise<WorkflowInstance>;
  claimMeetingBooking(input: SaveWorkflowInstanceInput): Promise<WorkflowInstance>;
}

export interface IWorkflowService {
  start(workflowId: string, context: WorkflowStartContext): Promise<WorkflowPublicInstance>;
  getAssistantContext(instanceId: string | null): Promise<WorkflowAssistantContext>;
  executeTool(
    instanceId: string | null,
    toolCall: WorkflowToolCall,
  ): Promise<WorkflowToolExecutionResult>;
  cancel(instanceId: string): Promise<WorkflowPublicInstance>;
  confirmWorkflow(
    instanceId: string,
    actionKey: string,
    expectedRevision: number,
  ): Promise<WorkflowToolExecutionResult>;
  retryWorkflow(instanceId: string): Promise<WorkflowToolExecutionResult>;
  confirmMeetingBooking(
    instanceId: string,
    expectedRevision: number,
  ): Promise<WorkflowToolExecutionResult>;
  retryMeetingBooking(instanceId: string): Promise<WorkflowToolExecutionResult>;
}
