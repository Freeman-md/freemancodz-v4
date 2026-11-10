import "server-only";
import { z } from "zod";
import type {
  BookMeetingInput,
  MeetingBookingDetails,
  MeetingRecordInput,
  MeetingSlot,
} from "./types";
import {
  CalendarAvailabilityError,
  CalendarEventError,
  type CalendarBusyPeriod,
  type CalendarClient,
  type CreatedCalendarEvent,
} from "@/infrastructure/google-calendar/types";
import type { Logger } from "@/infrastructure/logging/logger";
import { MEETING_CONFIG } from "./config";
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
        this.logger.error("meeting.availability_failed", { category: "calendar_unavailable" });
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

  async resolveApprovedCalendar(
    input: BookMeetingInput,
    eventId: string,
    lookupOnly: boolean,
    markDispatch: () => Promise<boolean>,
    signal: AbortSignal,
  ): Promise<MeetingRecordInput> {
    const lookup = async () => {
      try {
        return await this.calendar.findEvent(eventId, signal);
      } catch (error) {
        throw new MeetingBookingError("unavailable", error);
      }
    };

    let event = await lookup();

    if (!event) {
      if (lookupOnly) {
        throw new MeetingBookingError("conflict");
      }

      let available: boolean;

      try {
        available = await this.isSlotAvailable(input.slot, signal);
      } catch (error) {
        throw new MeetingBookingError("unavailable", error);
      }

      if (!available) {
        throw new MeetingBookingError("slot_unavailable");
      }

      if (signal.aborted) {
        throw new MeetingBookingError("unavailable");
      }

      if (!(await markDispatch())) {
        throw new MeetingBookingError("uncertain");
      }

      try {
        event = await this.calendar.createEvent(
          {
            eventId,
            bookingOperationId: input.bookingOperationId,
            summary: `Meeting with ${input.name}`,
            description: input.reason,
            attendeeEmail: input.email,
            start: new Date(input.slot.start),
            end: new Date(input.slot.end),
            timezone: input.slot.timezone,
          },
          signal,
        );
      } catch (error) {
        const code = error instanceof CalendarEventError ? error.outcome : "uncertain";

        throw new MeetingBookingError(code, error);
      }
    }

    assertMatchingCalendarEvent(
      event,
      lookupOnly
        ? { name: input.name, email: input.email, reason: input.reason, slot: input.slot }
        : input,
      eventId,
    );

    return {
      googleEventId: event.id,
      googleEventUrl: event.htmlLink,
      rawProviderPayload: event.payload,
      name: input.name,
      email: input.email,
      reason: input.reason,
      timezone: input.slot.timezone,
      startsAt: new Date(input.slot.start),
      endsAt: new Date(input.slot.end),
      status: "confirmed",
    };
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

function assertMatchingCalendarEvent(
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
