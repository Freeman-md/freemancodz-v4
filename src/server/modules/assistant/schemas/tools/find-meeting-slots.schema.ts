import { z } from "zod";

export const findMeetingSlotsSchema = z.object({
  startDate: z.string().date(),
  endDate: z.string().date(),
  timezone: z.string().trim().min(1).max(100),
}).strict();

export type FindMeetingSlotsInput = z.infer<typeof findMeetingSlotsSchema>;
