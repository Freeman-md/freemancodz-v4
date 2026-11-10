import { z } from "zod";
import { workflowProgressSchema } from "./workflow-progress.contract";
import { assistantChoiceSchema } from "./assistant-choice.contract";

export const MAX_MESSAGE_LENGTH = 500;

export const assistantTriggerEvent = "portfolio-chat:open";

export const workflowInstanceIdSchema = z.string().uuid();

const sourceSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
  })
  .strict();

const workflowInstanceSchema = z
  .object({
    id: workflowInstanceIdSchema,
    workflowId: z.string().min(1),
    workflowVersion: z.number().int().positive(),
    revision: z.number().int().nonnegative(),
    confirmationAction: z.enum(["confirm", "retry", "blocked"]).optional(),
    status: z.enum(["active", "completed", "cancelled"]),
    progress: workflowProgressSchema,
  })
  .strict();

const assistantMessageSchema = z
  .object({
    message: z.string().trim().min(1, "Message is required.").max(MAX_MESSAGE_LENGTH),
    previousResponseId: z.string().nullable().optional().transform(normalizePreviousResponseId),
    workflowInstanceId: workflowInstanceIdSchema.nullable().optional(),
  })
  .strict();

export const assistantWorkflowActionSchema = z.union([
  z
    .object({
      action: z.literal("confirm_booking"),
      workflowInstanceId: workflowInstanceIdSchema,
      expectedRevision: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({ action: z.literal("retry_booking"), workflowInstanceId: workflowInstanceIdSchema })
    .strict(),
]);

export const assistantRequestSchema = z.union([
  assistantMessageSchema,
  assistantWorkflowActionSchema,
]);

function normalizePreviousResponseId(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const responseId = value.trim();

  return responseId.length > 0 && responseId.length <= 200 && responseId.startsWith("resp_")
    ? responseId
    : null;
}

export const assistantStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("choice"), choice: assistantChoiceSchema }).strict(),
  z.object({ type: z.literal("delta"), delta: z.string() }).strict(),
  z.object({ type: z.literal("sources"), sources: z.array(sourceSchema) }).strict(),
  z.object({ type: z.literal("response_id"), responseId: z.string() }).strict(),
  z
    .object({
      type: z.literal("workflow_instance"),
      instance: workflowInstanceSchema.nullable(),
    })
    .strict(),
  z.object({ type: z.literal("done") }).strict(),
  z.object({ type: z.literal("error"), error: z.string() }).strict(),
]);

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;
export type AssistantWorkflowAction = z.infer<typeof assistantWorkflowActionSchema>;
export type AssistantStreamEvent = z.infer<typeof assistantStreamEventSchema>;
export type AssistantSource = z.infer<typeof sourceSchema>;
export type WorkflowPublicInstance = z.infer<typeof workflowInstanceSchema>;
