import { z } from "zod";

const MAX_MESSAGE_LENGTH = 500;

export const assistantTriggerEvent = "portfolio-chat:open";

const sourceSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
  })
  .strict();

const workflowInstanceSchema = z
  .object({
    id: z.string().uuid(),
    workflowId: z.string().min(1),
    workflowVersion: z.number().int().positive(),
    status: z.enum(["active", "completed", "cancelled"]),
  })
  .strict();

const workflowStartSchema = z.discriminatedUnion("originEntry", [
  z
    .object({
      workflowId: z.literal("audit"),
      originPage: z.literal("/"),
      originEntry: z.literal("home-audit-cta"),
    })
    .strict(),
  z
    .object({
      workflowId: z.literal("audit"),
      originPage: z.literal("/"),
      originEntry: z.literal("assistant-starter-audit"),
    })
    .strict(),
  z
    .object({
      workflowId: z.literal("meeting-booking"),
      originPage: z.literal("/"),
      originEntry: z.literal("assistant-starter-meeting"),
    })
    .strict(),
  z
    .object({
      workflowId: z.literal("contact"),
      originPage: z.literal("/"),
      originEntry: z.literal("assistant-starter-contact"),
    })
    .strict(),
]);

export const assistantRequestSchema = z
  .object({
    message: z.string().trim().min(1, "Message is required.").max(MAX_MESSAGE_LENGTH),
    previousResponseId: z.string().nullable().optional().transform(normalizePreviousResponseId),
    workflowInstanceId: z.string().uuid().nullable().optional(),
    workflowStart: workflowStartSchema.nullable().optional(),
  })
  .strict();

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
  z.object({ type: z.literal("delta"), delta: z.string() }).strict(),
  z.object({ type: z.literal("sources"), sources: z.array(sourceSchema) }).strict(),
  z.object({ type: z.literal("response_id"), responseId: z.string() }).strict(),
  z
    .object({
      type: z.literal("workflow_instance"),
      instance: workflowInstanceSchema,
    })
    .strict(),
  z.object({ type: z.literal("done") }).strict(),
  z.object({ type: z.literal("error"), error: z.string() }).strict(),
]);

export const assistantTriggerDetailSchema = z
  .object({
    message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH).optional(),
    workflowStart: workflowStartSchema.optional(),
  })
  .strict();

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;
export type AssistantStreamEvent = z.infer<typeof assistantStreamEventSchema>;
export type AssistantSource = z.infer<typeof sourceSchema>;
export type AssistantTriggerDetail = z.infer<typeof assistantTriggerDetailSchema>;
export type AssistantWorkflowStart = z.infer<typeof workflowStartSchema>;
export type WorkflowPublicInstance = z.infer<typeof workflowInstanceSchema>;
