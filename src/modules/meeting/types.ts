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

export type MeetingReservationStore = {
  reserve(input: MeetingRecordInput): Promise<MeetingRecord | null>;
  release(transaction: Prisma.TransactionClient, eventId: string): Promise<void>;
  confirm(input: MeetingRecordInput): Promise<MeetingRecord | null>;
  findMeetingByGoogleEventId(eventId: string): Promise<MeetingRecord | null>;
};

export type MeetingSlot = {
  start: string;
  end: string;
  timezone: string;
};

export type MeetingBookingDetails = {
  name: string;
  email: string;
  reason: string;
  slot: MeetingSlot;
};

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

export type MeetingAvailability = {
  findAvailableSlots(input: { startDate: string; endDate: string }): Promise<MeetingSlot[]>;
  isSlotAvailable(slot: MeetingSlot, signal?: AbortSignal): Promise<boolean>;
};
