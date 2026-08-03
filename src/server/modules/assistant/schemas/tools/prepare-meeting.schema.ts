import { z } from "zod";

export const prepareMeetingSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slotId: z.string().trim().min(1).max(100),
  attendeeName: z.string().trim().min(1).max(160),
}).strict();

export type PrepareMeetingInput = z.infer<typeof prepareMeetingSchema>;
