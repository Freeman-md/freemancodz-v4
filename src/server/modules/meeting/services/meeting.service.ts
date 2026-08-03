import "server-only";
import type { MeetingSlot } from "@/contracts/assistant.contract";
import type { IGoogleCalendarProvider } from "@/server/infrastructure/google-calendar/interfaces/google-calendar.provider.interface";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import { MEETING_CONFIG } from "../meeting.config";
import type { IMeetingRepository } from "../interfaces/meeting.repository.interface";
import { MeetingPersistenceError, type IMeetingService, type PendingCalendarEvent } from "../interfaces/meeting.service.interface";

export class MeetingService implements IMeetingService {
  constructor(
    private readonly calendar: IGoogleCalendarProvider,
    private readonly repository: IMeetingRepository,
    private readonly logger: ILogger,
  ) {}

  async findAvailableSlots(input: { startDate: string; endDate: string }): Promise<MeetingSlot[]> {
    const candidates = this.createCandidates(input.startDate, input.endDate);

    if (!candidates.length) {
      return [];
    }

    const busy = await this.calendar.getBusyPeriods({
      start: new Date(candidates[0].start),
      end: new Date(candidates.at(-1)!.end),
    });

    return candidates.filter(
      (slot) =>
        !busy.some((period) =>
          overlaps(new Date(slot.start), new Date(slot.end), period.start, period.end),
        ),
    );
  }

  async isSlotAvailable(slot: MeetingSlot) {
    const busy = await this.calendar.getBusyPeriods({
      start: new Date(slot.start),
      end: new Date(slot.end),
    });

    return !busy.some((period) =>
      overlaps(new Date(slot.start), new Date(slot.end), period.start, period.end),
    );
  }

  async bookMeeting(input: {
    name: string;
    email: string;
    timezone: string;
    reason: string;
    slot: MeetingSlot;
  }) {
    const event = await this.calendar.createEvent({
      summary: `Meeting with ${input.name}`,
      description: input.reason,
      attendeeEmail: input.email,
      start: new Date(input.slot.start),
      end: new Date(input.slot.end),
      timezone: input.timezone,
    });

    const pendingEvent = { googleEventId: event.id, googleEventUrl: event.htmlLink, rawProviderPayload: event.payload };

    return this.reconcileMeeting({ ...input, pendingEvent });
  }

  async reconcileMeeting(input: { name: string; email: string; timezone: string; reason: string; slot: MeetingSlot; pendingEvent: PendingCalendarEvent }) {
    const record = {
      googleEventId: input.pendingEvent.googleEventId,
      name: input.name,
      email: input.email,
      timezone: input.timezone,
      reason: input.reason,
      startsAt: new Date(input.slot.start),
      endsAt: new Date(input.slot.end),
      status: "confirmed",
      googleEventUrl: input.pendingEvent.googleEventUrl,
      rawProviderPayload: JSON.parse(JSON.stringify(input.pendingEvent.rawProviderPayload)) as import("@/generated/prisma/client").Prisma.InputJsonObject,
    };

    try {
      await this.repository.createMeeting(record);
    } catch (error) {
      const existing = await this.repository.findMeetingByGoogleEventId(input.pendingEvent.googleEventId);

      if (!existing) {
        this.logger.error("Meeting persistence failed after calendar event creation", {
          googleEventId: input.pendingEvent.googleEventId,
          startsAt: input.slot.start,
        });

        throw new MeetingPersistenceError(input.pendingEvent, error);
      }
    }

    return { googleEventId: input.pendingEvent.googleEventId, googleEventUrl: input.pendingEvent.googleEventUrl };
  }

  private createCandidates(startDate: string, endDate: string): MeetingSlot[] {
    const start = new Date(`${startDate}T00:00:00Z`);

    const end = new Date(`${endDate}T00:00:00Z`);

    const now = Date.now();

    const slots: MeetingSlot[] = [];

    for (let current = start; current <= end; current = new Date(current.getTime() + 86_400_000)) {
      if (!MEETING_CONFIG.workingDays.includes(current.getUTCDay() as 1 | 2 | 3 | 4 | 5)) {
        continue;
      }

      const date = current.toISOString().slice(0, 10);

      for (
        let hour = MEETING_CONFIG.startHour;
        hour < MEETING_CONFIG.endHour;
        hour += MEETING_CONFIG.durationMinutes / 60
      ) {
        const startsAt = zonedDateTimeToUtc(date, hour, MEETING_CONFIG.timezone);

        const endsAt = new Date(startsAt.getTime() + MEETING_CONFIG.durationMinutes * 60_000);

        if (startsAt.getTime() > now) {
          slots.push({
            start: startsAt.toISOString(),
            end: endsAt.toISOString(),
            timezone: MEETING_CONFIG.timezone,
          });
        }
      }
    }

    return slots;
  }
}

function overlaps(start: Date, end: Date, busyStart: Date, busyEnd: Date) {
  return start < busyEnd && end > busyStart;
}

function zonedDateTimeToUtc(date: string, hour: number, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);

  const naive = Date.UTC(year!, month! - 1, day!, Math.floor(hour), (hour % 1) * 60);

  let result = new Date(naive);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(result);

    const values = Object.fromEntries(
      parts
        .filter(({ type }) => type !== "literal")
        .map(({ type, value }) => [type, Number(value)]),
    );

    const displayed = Date.UTC(
      values.year!,
      values.month! - 1,
      values.day!,
      values.hour!,
      values.minute!,
    );

    result = new Date(result.getTime() + (naive - displayed));
  }

  return result;
}
