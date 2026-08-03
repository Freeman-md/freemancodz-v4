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
export interface IMeetingRepository {
  createMeeting(input: MeetingRecordInput): Promise<MeetingRecord>;
  findMeetingByGoogleEventId(googleEventId: string): Promise<MeetingRecord | null>;
  updateMeeting(input: MeetingRecordInput): Promise<MeetingRecord>;
}
