import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type {
  IMeetingRepository,
  MeetingRecord,
  MeetingRecordInput,
} from "../interfaces/meeting.repository.interface";

export class MeetingRepository implements IMeetingRepository {
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
