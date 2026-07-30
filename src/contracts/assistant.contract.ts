import { z } from "zod";

const MAX_MESSAGE_LENGTH = 500;

const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
});

export const assistantRequestSchema = z.object({
  message: z.string().trim().min(1, "Message is required.").max(MAX_MESSAGE_LENGTH),
  previousResponseId: z.string().nullable().optional().transform(normalizePreviousResponseId),
});

function normalizePreviousResponseId(value: string | null | undefined) {
  if (!value) return null;
  const responseId = value.trim();
  return responseId.length > 0 && responseId.length <= 200 && responseId.startsWith("resp_") ? responseId : null;
}

export const assistantStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("delta"), delta: z.string() }),
  z.object({ type: z.literal("sources"), sources: z.array(sourceSchema) }),
  z.object({ type: z.literal("response_id"), responseId: z.string() }),
  z.object({ type: z.literal("done") }),
  z.object({ type: z.literal("error"), error: z.string() }),
]);

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;
export type AssistantStreamEvent = z.infer<typeof assistantStreamEventSchema>;
export type AssistantSource = z.infer<typeof sourceSchema>;
