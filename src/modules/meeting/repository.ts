import "server-only";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { MeetingRecord, MeetingRecordInput, MeetingReservationStore } from "./types";

export class MeetingRepository implements MeetingReservationStore {
  constructor(private readonly database: PrismaClient) {}

  reserve(input: MeetingRecordInput) {
    return this.database.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL lock_timeout = '2s'`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('freemancodz:meeting-booking'))`;

      const existing = await tx.meeting.findUnique({
        where: { googleEventId: input.googleEventId },
      });

      if (existing) {
        return existing;
      }

      const overlap = await tx.meeting.findFirst({
        where: {
          startsAt: { lt: input.endsAt },
          endsAt: { gt: input.startsAt },
          status: { in: ["pending", "confirmed"] },
        },
        select: { id: true },
      });

      if (overlap) {
        return null;
      }

      // Legacy workflows can hold a slot before the Meeting row exists.
      const [legacy] = await tx.$queryRaw<{ blocked: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM workflow_instances w
          WHERE w.workflow_id = 'meeting-booking' AND w.status = 'active'
            AND w.state->>'step' = 'confirmed'
            AND CASE
              WHEN (w.state->'selectedSlot'->>'start') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
               AND (w.state->'selectedSlot'->>'end') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
              THEN (w.state->'selectedSlot'->>'start')::timestamptz < ${input.endsAt}
                AND (w.state->'selectedSlot'->>'end')::timestamptz > ${input.startsAt}
              ELSE true
            END
        ) AS blocked
      `;

      return legacy?.blocked ? null : tx.meeting.create({ data: input });
    });
  }

  async release(transaction: Prisma.TransactionClient, eventId: string) {
    await transaction.meeting.deleteMany({ where: { googleEventId: eventId, status: "pending" } });
  }

  async confirm(input: MeetingRecordInput) {
    const [confirmed] = await this.database.meeting.updateManyAndReturn({
      where: { googleEventId: input.googleEventId, status: "pending" },
      data: input,
    });

    return confirmed ?? null;
  }

  async findMeetingByGoogleEventId(googleEventId: string): Promise<MeetingRecord | null> {
    return this.database.meeting.findUnique({ where: { googleEventId } });
  }
}
