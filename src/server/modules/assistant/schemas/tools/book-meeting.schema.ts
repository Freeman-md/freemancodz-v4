import { z } from "zod";

export const bookMeetingSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slotId: z.string().trim().min(1).max(100),
  attendeeName: z.string().trim().min(1).max(160),
  confirmed: z.literal(true),
}).strict();

export type BookMeetingInput = z.infer<typeof bookMeetingSchema>;
