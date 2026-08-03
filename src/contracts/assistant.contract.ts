import { z } from "zod";

const MAX_MESSAGE_LENGTH = 500;

const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
});

const meetingSlotSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  timezone: z.string().min(1).max(100),
});

const meetingWorkflowPublicStateSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  timezone: z.string().nullable(),
  reason: z.string().nullable(),
  availableSlots: z.array(meetingSlotSchema),
  availabilityCheckedAt: z.string().datetime().nullable(),
  selectedSlot: meetingSlotSchema.nullable(),
  confirmed: z.boolean(),
});

export const assistantRequestSchema = z.object({
  message: z.string().trim().min(1, "Message is required.").max(MAX_MESSAGE_LENGTH),
  previousResponseId: z.string().nullable().optional().transform(normalizePreviousResponseId),
  workflowToken: z.string().min(1).max(10_000).nullable().optional(),
});

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
  z.object({ type: z.literal("delta"), delta: z.string() }),
  z.object({ type: z.literal("sources"), sources: z.array(sourceSchema) }),
  z.object({ type: z.literal("response_id"), responseId: z.string() }),
  z.object({
    type: z.literal("meeting_workflow"),
    token: z.string(),
    state: meetingWorkflowPublicStateSchema,
  }),
  z.object({ type: z.literal("done") }),
  z.object({ type: z.literal("error"), error: z.string() }),
]);

export const assistantTriggerDetailSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH).optional(),
});

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;
export type AssistantStreamEvent = z.infer<typeof assistantStreamEventSchema>;
export type AssistantSource = z.infer<typeof sourceSchema>;
export type AssistantTriggerDetail = z.infer<typeof assistantTriggerDetailSchema>;
export type MeetingSlot = z.infer<typeof meetingSlotSchema>;
export type MeetingWorkflowPublicState = z.infer<typeof meetingWorkflowPublicStateSchema>;
