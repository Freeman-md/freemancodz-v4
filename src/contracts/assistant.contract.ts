import { z } from "zod";
import { workflowProgressSchema } from "./workflow-progress.contract";
import { assistantChoiceSchema } from "./assistant-choice.contract";

export const MAX_MESSAGE_LENGTH = 500;

export const assistantTriggerEvent = "portfolio-chat:open";

export const WORKFLOW_ACCESS_DENIED = "workflow_access_denied";

const workflowIdSchema = z.uuid();

export const workflowReferenceSchema = z.string().refine((reference) => {
  const [id, signature, extra] = reference.split(".");

  return (
    extra === undefined &&
    workflowIdSchema.safeParse(id).success &&
    signature !== undefined &&
    /^[A-Za-z0-9_-]{43}$/.test(signature)
  );
}, "Invalid workflow reference.");

const sourceSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
  })
  .strict();

export const workflowReviewSchema = z.strictObject({
  actionKey: z.string().min(1).max(100),
  title: z.string().min(1).max(100),
  fields: workflowProgressSchema.shape.fields.element
    .extend({ label: z.string().min(1).max(100) })
    .array()
    .max(20),
});

export type WorkflowReview = z.infer<typeof workflowReviewSchema>;

const workflowInstanceSchema = z
  .object({
    id: workflowReferenceSchema,
    workflowId: z.string().min(1),
    workflowVersion: z.number().int().positive(),
    revision: z.number().int().nonnegative(),
    confirmationAction: z.enum(["confirm", "retry", "blocked"]).optional(),
    review: workflowReviewSchema.optional(),
    outcome: z
      .strictObject({
        booking: z.enum(["pending", "confirmed", "needs_review", "not_booked"]),
        ownerNotice: z.enum(["not_started", "pending", "accepted", "needs_review"]),
        retryAt: z.string().datetime().optional(),
      })
      .optional(),
    status: z.enum(["active", "completed", "cancelled"]),
    progress: workflowProgressSchema,
  })
  .strict();

const assistantMessageSchema = z
  .object({
    message: z.string().trim().min(1, "Message is required.").max(MAX_MESSAGE_LENGTH),
    previousResponseId: z.string().nullable().optional().transform(normalizePreviousResponseId),
    workflowInstanceId: workflowReferenceSchema.nullable().optional(),
  })
  .strict();

export const assistantWorkflowActionSchema = z.union([
  z
    .object({
      action: z.literal("confirm_workflow"),
      workflowInstanceId: workflowReferenceSchema,
      actionKey: z.string().min(1).max(100),
      expectedRevision: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({ action: z.literal("retry_workflow"), workflowInstanceId: workflowReferenceSchema })
    .strict(),
]);

const assistantWorkflowStatusSchema = z
  .object({
    action: z.literal("workflow_status"),
    workflowInstanceId: workflowReferenceSchema,
  })
  .strict();

export const assistantRequestSchema = z.union([
  assistantMessageSchema,
  assistantWorkflowActionSchema,
  assistantWorkflowStatusSchema,
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
export type AssistantWorkflowStatusAction = z.infer<typeof assistantWorkflowStatusSchema>;
export type AssistantStreamEvent = z.infer<typeof assistantStreamEventSchema>;
export type AssistantSource = z.infer<typeof sourceSchema>;
export type WorkflowPublicInstance = z.infer<typeof workflowInstanceSchema>;
