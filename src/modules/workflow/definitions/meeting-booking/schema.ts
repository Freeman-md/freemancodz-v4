import { z } from "zod";
import { MEETING_CONFIG } from "@/modules/meeting/config";

const meetingSlotSchema = z.strictObject({
  start: z.iso.datetime(),
  end: z.iso.datetime(),
  timezone: z.literal(MEETING_CONFIG.timezone),
});

export const meetingStateSchema = z.strictObject({
  reason: z.string().trim().min(1).nullable(),
  availableSlots: z.array(meetingSlotSchema).default([]),
  selectedSlot: meetingSlotSchema.nullable().default(null),
});

export type MeetingState = z.infer<typeof meetingStateSchema>;

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
