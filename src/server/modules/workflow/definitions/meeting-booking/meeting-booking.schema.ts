import { z } from "zod";

export const meetingSlotSchema = z
  .object({
    start: z.string().datetime(),
    end: z.string().datetime(),
    timezone: z.string().min(1).max(100),
  })
  .strict();

export const meetingBookingStateSchema = z
  .object({
    step: z.enum(["collecting", "awaiting_confirmation", "confirmed"]),
    name: z.string().max(160).nullable(),
    email: z.string().email().max(320).nullable(),
    reason: z.string().max(1_000).nullable(),
    availableSlots: z.array(meetingSlotSchema).max(40),
    availabilityCheckedAt: z.string().datetime().nullable(),
    selectedSlot: meetingSlotSchema.nullable(),
    pendingBooking: z
      .object({
        googleEventId: z.string().min(1),
        googleEventUrl: z.string().url().nullable(),
        rawProviderPayload: z.record(z.string(), z.json()),
        name: z.string().min(1).max(160),
        email: z.string().email().max(320),
        reason: z.string().min(1).max(1_000),
        selectedSlot: meetingSlotSchema,
      })
      .strict()
      .nullable(),
  })
  .strict();

export const findMeetingSlotsSchema = z
  .object({
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  })
  .strict();

export const prepareMeetingSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    email: z.string().trim().email().max(320),
    reason: z.string().trim().min(1).max(1_000),
    selectedSlot: z
      .object({
        start: z.string().datetime(),
        end: z.string().datetime(),
      })
      .strict(),
  })
  .strict();

export const noArgumentsSchema = z.object({}).strict();

export type MeetingBookingState = z.infer<typeof meetingBookingStateSchema>;
export type FindMeetingSlotsInput = z.infer<typeof findMeetingSlotsSchema>;
export type PrepareMeetingInput = z.infer<typeof prepareMeetingSchema>;
