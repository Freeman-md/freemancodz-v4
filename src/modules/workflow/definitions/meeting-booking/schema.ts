import { z } from "zod";
import { MEETING_CONFIG } from "@/modules/meeting/config";

export const meetingSlotSchema = z.strictObject({
  start: z.iso.datetime(),
  end: z.iso.datetime(),
  timezone: z.literal(MEETING_CONFIG.timezone),
});

export const meetingStateSchema = z.strictObject({
  name: z.string().trim().min(1).max(160).nullable().default(null),
  email: z.email().max(320).nullable().default(null),
  reason: z.string().trim().min(1).max(500).nullable().default(null),
  availableSlots: z.array(meetingSlotSchema).default([]),
  selectedSlot: meetingSlotSchema.nullable().default(null),
});

export type MeetingState = z.infer<typeof meetingStateSchema>;

export const identityArgumentsSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(160).nullable(),
    email: z.string().trim().pipe(z.email().max(320)).nullable(),
  })
  .refine(({ name, email }) => name !== null || email !== null);

export const topicArgumentsSchema = z.strictObject({
  reason: z.string().trim().min(1).max(500),
});

export const findSlotsArgumentsSchema = z.strictObject({
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

export const selectSlotArgumentsSchema = z.strictObject({
  start: z.iso.datetime(),
});

export const meetingBookingPayloadSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(160),
    email: z.email().max(320),
    reason: z.string().trim().min(1).max(500),
    slot: meetingSlotSchema,
  })
  .refine(
    ({ slot }) =>
      Date.parse(slot.end) - Date.parse(slot.start) === MEETING_CONFIG.durationMinutes * 60_000,
  );
