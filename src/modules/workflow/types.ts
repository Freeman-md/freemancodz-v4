import type { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";

export type WorkflowDefinition<State extends Prisma.InputJsonObject = Prisma.InputJsonObject> = {
  id: string;
  version: number;
  description: string;
  stateSchema: z.ZodType<State>;
  createInitialState(): State;
};
