import { z } from "zod";

function normalizePreviousResponseId(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const responseId = value.trim();

  return responseId.length > 0 && responseId.length <= 200 && responseId.startsWith("resp_")
    ? responseId
    : null;
}

export const MAX_MESSAGE_LENGTH = 500;

export const workflowObservationSchema = z.strictObject({
  id: z.uuid(),
  revision: z.number().int().min(0).max(2_147_483_647),
});

export type WorkflowObservation = z.infer<typeof workflowObservationSchema>;

export const assistantRequestSchema = z
  .object({
    observedWorkflow: workflowObservationSchema.optional(),
    message: z.string().trim().min(1, "Message is required.").max(MAX_MESSAGE_LENGTH),
    previousResponseId: z.string().nullable().optional().transform(normalizePreviousResponseId),
  })
  .strict();

export const assistantReplyOptionsSchema = z
  .array(z.string().trim().min(1).max(120))
  .min(2)
  .max(4)
  .refine(
    (options) => new Set(options.map((option) => option.toLowerCase())).size === options.length,
    { message: "Options must be distinct." },
  );

const sourceSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
  })
  .strict();

export const workflowReviewDisplaySchema = z.strictObject({
  label: z.string().min(1),
  rows: z.array(z.strictObject({ key: z.string(), label: z.string(), value: z.string() })).min(1),
});

export const workflowApprovalSchema = z.strictObject({
  reviewId: z.uuid(),
  expectedRevision: workflowObservationSchema.shape.revision,
});

export type WorkflowApproval = z.infer<typeof workflowApprovalSchema>;

export const activeWorkflowSchema = workflowObservationSchema.extend({
  title: z.string(),
  status: z.enum(["active", "completed", "attention"]),
  review: workflowReviewDisplaySchema.extend({ id: z.uuid() }).optional(),
  run: z
    .strictObject({
      status: z.enum(["queued", "running", "retry", "finished", "attention"]),
      businessStatus: z.string().optional(),
      steps: z.array(
        z.strictObject({
          key: z.string(),
          label: z.string(),
          status: z.enum(["queued", "running", "retry", "reconciling", "succeeded", "attention"]),
        }),
      ),
    })
    .optional(),
  phase: z.enum(["collecting", "awaiting_confirmation", "processing", "completed", "cancelled"]),
  details: z.array(
    z.strictObject({
      key: z.string(),
      label: z.string(),
      value: z.string().nullable(),
    }),
  ),
});

export type ActiveWorkflow = z.infer<typeof activeWorkflowSchema>;

export const assistantStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("delta"), delta: z.string() }).strict(),
  z.object({ type: z.literal("options"), options: assistantReplyOptionsSchema }).strict(),
  z.object({ type: z.literal("sources"), sources: z.array(sourceSchema) }).strict(),
  z.strictObject({
    type: z.literal("workflow_instance"),
    instance: activeWorkflowSchema,
  }),
  z.object({ type: z.literal("response_id"), responseId: z.string() }).strict(),
  z.object({ type: z.literal("done") }).strict(),
  z.object({ type: z.literal("error"), error: z.string() }).strict(),
]);

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;
export type AssistantStreamEvent = z.infer<typeof assistantStreamEventSchema>;
export type AssistantSource = z.infer<typeof sourceSchema>;
