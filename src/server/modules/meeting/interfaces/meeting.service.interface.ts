import type { Prisma } from "@/generated/prisma/client";
import type { MeetingSlot } from "../models/meeting-slot";
export type PendingCalendarEvent = {
  googleEventId: string;
  googleEventUrl: string | null;
  rawProviderPayload: Prisma.JsonObject;
};
export class MeetingPersistenceError extends Error {
  constructor(
    readonly pendingEvent: PendingCalendarEvent,
    cause: unknown,
  ) {
    super("Calendar event was created but meeting persistence failed.", { cause });
  }
}
export interface IMeetingService {
  findAvailableSlots(input: { startDate: string; endDate: string }): Promise<MeetingSlot[]>;
  isSlotAvailable(slot: MeetingSlot): Promise<boolean>;
  bookMeeting(input: {
    name: string;
    email: string;
    reason: string;
    slot: MeetingSlot;
  }): Promise<{ googleEventId: string; googleEventUrl: string | null }>;
  reconcileMeeting(input: {
    name: string;
    email: string;
    reason: string;
    slot: MeetingSlot;
    pendingEvent: PendingCalendarEvent;
  }): Promise<{ googleEventId: string; googleEventUrl: string | null }>;
}
