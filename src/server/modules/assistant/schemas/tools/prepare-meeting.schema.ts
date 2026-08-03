import { z } from "zod";

export const prepareMeetingSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    email: z.string().trim().email().max(320),
    timezone: z.string().trim().min(1).max(100),
    reason: z.string().trim().min(1).max(1000),
    selectedSlot: z
      .object({
        start: z.string().datetime(),
        end: z.string().datetime(),
        timezone: z.string().trim().min(1).max(100),
      })
      .strict(),
  })
  .strict();

export type PrepareMeetingInput = z.infer<typeof prepareMeetingSchema>;
