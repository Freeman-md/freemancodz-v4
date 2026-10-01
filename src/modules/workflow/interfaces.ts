import type { Prisma, WorkflowInstance } from "@/generated/prisma/client";
import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import type { z } from "zod";
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

export interface WorkflowDefinition<State extends Prisma.JsonObject = Prisma.JsonObject> {
  readonly id: string;
  readonly version: number;
  readonly description: string;
  readonly stateSchema: z.ZodType<State>;
  createInitialState(context: WorkflowStartContext): State;
  getInstructions(state: State): string;
  getTools(state: State): OpenAIResponseTool[];
  executeTool(
    name: string,
    rawArguments: string,
    state: State,
    context: WorkflowExecutionContext,
  ): Promise<WorkflowExecutionResult<State>>;
}

export interface WorkflowInstanceStore {
  create(input: CreateWorkflowInstanceInput): Promise<WorkflowInstance>;
  findById(id: string): Promise<WorkflowInstance | null>;
  save(input: SaveWorkflowInstanceInput): Promise<WorkflowInstance>;
}

export interface WorkflowServiceClient {
  start(workflowId: string, context: WorkflowStartContext): Promise<WorkflowPublicInstance>;
  getAssistantContext(instanceId: string | null): Promise<WorkflowAssistantContext>;
  executeTool(
    instanceId: string | null,
    toolCall: WorkflowToolCall,
  ): Promise<WorkflowToolExecutionResult>;
  cancel(instanceId: string): Promise<WorkflowPublicInstance>;
}
