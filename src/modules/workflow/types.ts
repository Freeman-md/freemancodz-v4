import type { ActiveWorkflow } from "@/contracts/assistant.contract";
import type { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";
import type { OpenAIResponseTool } from "@/infrastructure/openai/types";

export type WorkflowToolResult = {
  output: Prisma.InputJsonObject;
  state?: Prisma.InputJsonObject;
};

export type WorkflowTool = {
  tool: OpenAIResponseTool;
  apply(state: unknown, args: unknown): WorkflowToolResult | Promise<WorkflowToolResult>;
};

export interface IWorkflowDefinition<
  State extends Prisma.InputJsonObject = Prisma.InputJsonObject,
> {
  readonly id: string;
  readonly version: number;
  readonly title: string;
  readonly description: string;
  readonly stateSchema: z.ZodType<State>;

  createInitialState(): State;
  getProgress(savedState: unknown): Pick<ActiveWorkflow, "phase" | "details">;
  getTools(savedState: unknown): readonly WorkflowTool[];
}
