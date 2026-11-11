import type { ActiveWorkflow } from "@/contracts/assistant.contract";
import type { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";

export type WorkflowDefinition<State extends Prisma.InputJsonObject = Prisma.InputJsonObject> = {
  id: string;
  version: number;
  description: string;
  stateSchema: z.ZodType<State>;
  title: string;
  createInitialState(): State;
  projectProgress(state: unknown): Pick<ActiveWorkflow, "nextStep" | "details">;
};
