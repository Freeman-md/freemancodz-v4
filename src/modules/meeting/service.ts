import "server-only";
import { z } from "zod";
import type { MeetingBookingDetails, MeetingRecord, MeetingSlot } from "./types";
import {
  CalendarAvailabilityError,
  type CalendarBusyPeriod,
  type CalendarClient,
  type CreatedCalendarEvent,
} from "@/infrastructure/google-calendar/types";
import type { Logger } from "@/infrastructure/logging/logger";
import { MEETING_CONFIG } from "./config";
import { resolveMeetingTime } from "./time";
import { MeetingBookingError } from "./types";

const recoveredEventSchema = z.object({
  id: z.string(),
  status: z.literal("confirmed"),
  summary: z.string(),
  description: z.string(),
  attendees: z.array(z.object({ email: z.string().email() })).length(1),
  start: z.object({ dateTime: z.string().datetime({ offset: true }), timeZone: z.string() }),
  end: z.object({ dateTime: z.string().datetime({ offset: true }), timeZone: z.string() }),
  extendedProperties: z
    .object({
      private: z.object({ bookingOperationId: z.string().optional() }).optional(),
    })
    .optional(),
});

export class MeetingService {
  constructor(
    private readonly calendar: CalendarClient,
    private readonly logger: Logger,
  ) {}

  async findAvailableSlots(input: { startDate: string; endDate: string }): Promise<MeetingSlot[]> {
    const candidates = this.createCandidates(input.startDate, input.endDate);

    if (!candidates.length) {
      return [];
    }

    let busy: CalendarBusyPeriod[];

    try {
      busy = await this.calendar.getBusyPeriods({
        start: new Date(candidates[0].start),
        end: new Date(candidates.at(-1)!.end),
      });
    } catch (error) {
      if (error instanceof CalendarAvailabilityError) {
        this.logger.error("meeting.availability_failed", { category: error.category });
      }

      throw error;
    }

    return candidates.filter(
      (slot) =>
        !busy.some((period) =>
          overlaps(new Date(slot.start), new Date(slot.end), period.start, period.end),
        ),
    );
  }

  async isSlotAvailable(slot: MeetingSlot, signal?: AbortSignal) {
    if (slot.timezone !== MEETING_CONFIG.timezone || new Date(slot.start).getTime() <= Date.now()) {
      return false;
    }

    const busy = await this.calendar.getBusyPeriods(
      {
        start: new Date(slot.start),
        end: new Date(slot.end),
      },
      signal,
    );

    return !busy.some((period) =>
      overlaps(new Date(slot.start), new Date(slot.end), period.start, period.end),
    );
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
        const hours = String(Math.floor(hour)).padStart(2, "0");

        const minutes = String((hour % 1) * 60).padStart(2, "0");

        const startsAt = resolveMeetingTime(date, `${hours}:${minutes}`, MEETING_CONFIG.timezone);

        if (!startsAt) {
          continue;
        }

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

export function assertMatchingMeeting(
  meeting: MeetingRecord,
  input: MeetingBookingDetails,
  eventId: string,
): void {
  if (
    meeting.googleEventId !== eventId ||
    meeting.status !== "confirmed" ||
    meeting.name !== input.name ||
    meeting.email.toLowerCase() !== input.email.toLowerCase() ||
    meeting.reason !== input.reason ||
    meeting.timezone !== MEETING_CONFIG.timezone ||
    meeting.startsAt.getTime() !== Date.parse(input.slot.start) ||
    meeting.endsAt.getTime() !== Date.parse(input.slot.end)
  ) {
    throw new MeetingBookingError("conflict");
  }
}

export function assertMatchingCalendarEvent(
  event: CreatedCalendarEvent,
  input: MeetingBookingDetails & { bookingOperationId?: string },
  eventId: string,
): void {
  const result = recoveredEventSchema.safeParse(event.payload);

  if (!result.success) {
    throw new MeetingBookingError("conflict");
  }

  const payload = result.data;

  if (
    event.id !== eventId ||
    payload.id !== eventId ||
    (input.bookingOperationId !== undefined &&
      payload.extendedProperties?.private?.bookingOperationId !== input.bookingOperationId) ||
    payload.summary !== `Meeting with ${input.name}` ||
    payload.description !== input.reason ||
    payload.attendees[0].email.toLowerCase() !== input.email.toLowerCase() ||
    Date.parse(payload.start.dateTime) !== Date.parse(input.slot.start) ||
    Date.parse(payload.end.dateTime) !== Date.parse(input.slot.end) ||
    payload.start.timeZone !== MEETING_CONFIG.timezone ||
    payload.end.timeZone !== MEETING_CONFIG.timezone
  ) {
    throw new MeetingBookingError("conflict");
  }
}

function overlaps(start: Date, end: Date, busyStart: Date, busyEnd: Date) {
  return start < busyEnd && end > busyStart;
}
