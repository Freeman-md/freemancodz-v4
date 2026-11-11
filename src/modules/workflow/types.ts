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
  getGuidance(savedState: unknown): string;
  getReview?(savedState: unknown): WorkflowReview | null;
  getAction?(key: string): WorkflowAction | undefined;
  getTools(savedState: unknown): readonly WorkflowTool[];
}

export type WorkflowReview = {
  actionKey: string;
  label: string;
  rows: ReadonlyArray<{ key: string; label: string; value: string }>;
  payload: Prisma.InputJsonObject;
};

export type WorkflowStepResult =
  | { kind: "success"; outcome: Prisma.InputJsonObject }
  | { kind: "retry"; reason: string }
  | { kind: "terminal"; reason: string }
  | { kind: "uncertain"; reason: string };

export type WorkflowProbeResult =
  | { kind: "success"; outcome: Prisma.InputJsonObject }
  | { kind: "safe" }
  | { kind: "uncertain" | "terminal"; reason: string };

export type WorkflowStepInput = {
  id: string;
  runId: string;
  payload: Prisma.InputJsonObject;
  previous: ReadonlyMap<string, Prisma.JsonValue>;
  checkpoint: Prisma.JsonValue;
  firstEffect: Date;
  now: Date;
  signal: AbortSignal;
  saveCheckpoint(
    value: Prisma.InputJsonObject,
    persist?: (transaction: Prisma.TransactionClient) => Promise<void>,
  ): Promise<boolean>;
};

export type WorkflowAction = {
  payloadSchema: z.ZodType<Prisma.InputJsonObject>;
  steps: readonly {
    key: string;
    label: string;
    execute(input: WorkflowStepInput): Promise<WorkflowStepResult>;
    reconcile(input: WorkflowStepInput): Promise<WorkflowProbeResult>;
  }[];
  getStatus(successfulSteps: ReadonlySet<string>): string | undefined;
};
