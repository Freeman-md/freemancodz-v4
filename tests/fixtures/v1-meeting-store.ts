import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type {
  MeetingRecord,
  MeetingRecordInput,
  PendingCalendarEvent,
} from "@/modules/meeting/types";

export class MeetingRepository implements MeetingStore {
  constructor(private readonly database: PrismaClient) {}

  async createMeeting(input: MeetingRecordInput): Promise<MeetingRecord> {
    return this.database.meeting.create({ data: input });
  }

  async findMeetingByGoogleEventId(googleEventId: string): Promise<MeetingRecord | null> {
    return this.database.meeting.findUnique({ where: { googleEventId } });
  }

  async updateMeeting(input: MeetingRecordInput): Promise<MeetingRecord> {
    return this.database.meeting.update({
      where: { googleEventId: input.googleEventId },
      data: input,
    });
  }
}

export type MeetingStore = {
  createMeeting(input: MeetingRecordInput): Promise<MeetingRecord>;
  findMeetingByGoogleEventId(googleEventId: string): Promise<MeetingRecord | null>;
  updateMeeting(input: MeetingRecordInput): Promise<MeetingRecord>;
};

export class MeetingPersistenceError extends Error {
  constructor(
    readonly pendingEvent: PendingCalendarEvent,
    cause: unknown,
  ) {
    super("Calendar event was created but meeting persistence failed.", { cause });
  }
}
