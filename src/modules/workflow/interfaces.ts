import type { Prisma, WorkflowInstance } from "@/generated/prisma/client";
import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import type { WorkflowProgress } from "@/contracts/workflow-progress.contract";
import type { z } from "zod";
import type {
  AssistantPresentation,
  AssistantInteraction,
  AssistantInteractionReply,
  AssistantInteractionResult,
} from "@/contracts/assistant-ui.contract";
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
  readonly inputCapabilities?: {
    getFields(
      state: State,
    ): Array<Omit<AssistantInteraction["controls"][number], "label" | "options">>;
    apply(
      state: State,
      values: Record<string, string>,
    ): { state: State; fieldErrors: Record<string, string> };
  };
  createInitialState(context: WorkflowStartContext): State;
  getProgress(state: State, status: WorkflowPublicInstance["status"]): WorkflowProgress;
  getInstructions(state: State): string;
  getTools(state: State): OpenAIResponseTool[];
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
}

export interface IWorkflowService {
  prepareInteraction(
    instanceId: string | null,
    presentation: AssistantPresentation,
    requestedWorkflowId?: string,
  ): Promise<AssistantInteraction>;
  submitInteraction(
    instanceId: string | null,
    reply: AssistantInteractionReply,
  ): Promise<{ result: AssistantInteractionResult; instance: WorkflowPublicInstance | null }>;
  start(workflowId: string, context: WorkflowStartContext): Promise<WorkflowPublicInstance>;
  getAssistantContext(instanceId: string | null): Promise<WorkflowAssistantContext>;
  executeTool(
    instanceId: string | null,
    toolCall: WorkflowToolCall,
  ): Promise<WorkflowToolExecutionResult>;
  cancel(instanceId: string): Promise<WorkflowPublicInstance>;
}
