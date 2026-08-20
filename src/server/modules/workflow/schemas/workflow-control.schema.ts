import { z } from "zod";

export const StartWorkflowArgumentsSchema = z
  .object({
    workflowId: z.string().trim().min(1),
  })
  .strict();

export const CancelWorkflowArgumentsSchema = z.object({}).strict();

export const WorkflowStartContextSchema = z.object({
  originChannel: z.string().trim().min(1),
  originPage: z.string().trim().min(1).nullable(),
  originEntry: z.string().trim().min(1).nullable(),
});
