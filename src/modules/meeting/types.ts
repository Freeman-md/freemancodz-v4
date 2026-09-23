import type { Prisma } from "@/generated/prisma/client";

export type MeetingRecordInput = {
  googleEventId: string;
  name: string;
  email: string;
  timezone: string;
  reason: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  googleEventUrl: string | null;
  rawProviderPayload: Prisma.InputJsonObject;
};
export type MeetingRecord = Omit<MeetingRecordInput, "rawProviderPayload"> & {
  rawProviderPayload: Prisma.JsonValue;
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MeetingStore = {
  createMeeting(input: MeetingRecordInput): Promise<MeetingRecord>;
  findMeetingByGoogleEventId(googleEventId: string): Promise<MeetingRecord | null>;
  updateMeeting(input: MeetingRecordInput): Promise<MeetingRecord>;
};

export type MeetingSlot = {
  start: string;
  end: string;
  timezone: string;
};

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

export type MeetingServiceClient = {
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
};
