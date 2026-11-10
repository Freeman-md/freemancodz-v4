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
      | "unavailable"
      | "uncertain"
      | "conflict"
      | "slot_unavailable"
      | "invalid_operation"
      | "rejected"
      | "rate_limited",
    cause?: unknown,
  ) {
    super("The booking could not be safely completed. Retry the existing booking operation.", {
      cause,
    });
  }
}

export type MeetingServiceClient = {
  findAvailableSlots(input: { startDate: string; endDate: string }): Promise<MeetingSlot[]>;
};
