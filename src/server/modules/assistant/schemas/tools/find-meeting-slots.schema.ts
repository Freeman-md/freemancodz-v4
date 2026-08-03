import { z } from "zod";

export const findMeetingSlotsSchema = z.object({
  dateRange: z.string().trim().min(1).max(100),
  durationMinutes: z.number().int().min(15).max(120),
  timezone: z.string().trim().min(1).max(100),
}).strict();

export type FindMeetingSlotsInput = z.infer<typeof findMeetingSlotsSchema>;
