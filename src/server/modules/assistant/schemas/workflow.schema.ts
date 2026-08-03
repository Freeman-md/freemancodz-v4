import { z } from "zod";

const meetingSlotSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  timezone: z.string().min(1).max(100),
});

export const workflowStateSchema = z
  .object({
    name: z.string().max(160).nullable(),
    email: z.string().email().max(320).nullable(),
    timezone: z.string().min(1).max(100).nullable(),
    reason: z.string().max(1_000).nullable(),
    availableSlots: z.array(meetingSlotSchema).max(40),
    availabilityCheckedAt: z.string().datetime().nullable(),
    selectedSlot: meetingSlotSchema.nullable(),
    confirmed: z.boolean(),
    pendingBooking: z
      .object({
        googleEventId: z.string().min(1),
        googleEventUrl: z.string().url().nullable(),
        rawProviderPayload: z.record(z.string(), z.unknown()),
        name: z.string().min(1).max(160),
        email: z.string().email().max(320),
        timezone: z.string().min(1).max(100),
        reason: z.string().min(1).max(1_000),
        selectedSlot: meetingSlotSchema,
      })
      .nullable(),
  })
  .strict();
