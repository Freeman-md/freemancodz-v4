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

export type MeetingBookingDetails = {
  name: string;
  email: string;
  reason: string;
  slot: MeetingSlot;
};

export type BookMeetingInput = MeetingBookingDetails & { bookingOperationId: string };

export class MeetingBookingError extends Error {
  constructor(
    readonly code:
      "unavailable" | "uncertain" | "conflict" | "slot_unavailable" | "invalid_operation",
    cause?: unknown,
  ) {
    super("The booking could not be safely completed. Retry the existing booking operation.", {
      cause,
    });
  }
}

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
  bookMeeting(
    input: BookMeetingInput,
  ): Promise<{ googleEventId: string; googleEventUrl: string | null }>;
  reconcileMeeting(
    input: MeetingBookingDetails & {
      pendingEvent: PendingCalendarEvent;
      bookingOperationId?: string;
    },
  ): Promise<{ googleEventId: string; googleEventUrl: string | null }>;
};
