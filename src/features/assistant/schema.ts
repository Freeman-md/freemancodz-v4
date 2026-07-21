import { z } from "zod";

import { MAX_MESSAGE_LENGTH } from "./constants";

const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
});

export const assistantRequestSchema = z.object({
  message: z.string().trim().min(1, "Message is required.").max(MAX_MESSAGE_LENGTH),
  previousResponseId: z.string().trim().min(1).nullable().optional(),
});

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
