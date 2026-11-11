import { z } from "zod";

export const meetingStateSchema = z.strictObject({
  reason: z.string().trim().min(1).nullable(),
});

export type MeetingState = z.infer<typeof meetingStateSchema>;

export const topicArgumentsSchema = z.strictObject({
  reason: z.string().trim().min(1).max(500),
});
