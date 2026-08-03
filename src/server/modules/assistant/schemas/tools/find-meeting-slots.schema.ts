import { z } from "zod";

export const findMeetingSlotsSchema = z
  .object({
    startDate: z.string().date(),
    endDate: z.string().date(),
  })
  .strict();

export type FindMeetingSlotsInput = z.infer<typeof findMeetingSlotsSchema>;
