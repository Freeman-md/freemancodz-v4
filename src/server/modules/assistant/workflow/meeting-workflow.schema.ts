import { z } from "zod";

export const meetingWorkflowStateSchema = z.object({
  name: z.string().max(160).nullable(),
  email: z.string().email().max(320).nullable(),
  timezone: z.string().min(1).max(100).nullable(),
  reason: z.string().max(1_000).nullable(),
  availableSlots: z.array(z.object({ start: z.string().datetime(), end: z.string().datetime(), timezone: z.string().min(1).max(100) })).max(40),
  availabilityCheckedAt: z.string().datetime().nullable(),
  selectedSlot: z.object({ start: z.string().datetime(), end: z.string().datetime(), timezone: z.string().min(1).max(100) }).nullable(),
  confirmed: z.boolean(),
}).strict();
