import type { OpenAIResponseTool } from "@/server/infrastructure/openai/models/openai-response-request";
import type { z } from "zod";
import type {
  WorkflowExecutionContext,
  WorkflowExecutionResult,
} from "../models/workflow-definition";
import type { WorkflowStartContext } from "../models/workflow-instance";
import type { WorkflowJsonObject } from "../models/workflow-json";

export interface IWorkflowDefinition<State extends WorkflowJsonObject = WorkflowJsonObject> {
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
