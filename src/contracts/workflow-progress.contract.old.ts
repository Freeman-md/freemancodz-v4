import { z } from "zod";

const publicMeetingSlotSchema = z
  .object({
    start: z.string().datetime(),
    end: z.string().datetime(),
    timezone: z.string().min(1).max(100),
  })
  .strict();

const workflowProgressFieldSchema = z
  .object({
    key: z.string().trim().min(1).max(100),
    required: z.boolean(),
    value: z.union([z.string(), publicMeetingSlotSchema]).nullable(),
  })
  .strict();

export const workflowProgressSchema = z
  .object({
    phase: z.enum([
      "collecting",
      "awaiting_confirmation",
      "processing",
      "completed",
      "cancelled",
    ]),
    fields: z.array(workflowProgressFieldSchema).max(20),
    missingRequiredFields: z.array(z.string().trim().min(1).max(100)).max(20),
  })
  .strict();

export type WorkflowProgress = z.infer<typeof workflowProgressSchema>;
