import type { Prisma } from "@/generated/prisma/client";
import type { OpenAIResponseTool } from "@/server/infrastructure/openai/models/openai-response-request";
import type { z } from "zod";
import type {
  WorkflowExecutionContext,
  WorkflowExecutionResult,
  WorkflowStartContext,
} from "../workflow.types";

export interface IWorkflowDefinition<State extends Prisma.JsonObject = Prisma.JsonObject> {
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
