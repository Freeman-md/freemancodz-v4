import "server-only";
import { z } from "zod";
import type {
  BookMeetingInput,
  MeetingBookingDetails,
  MeetingRecord,
  MeetingRecordInput,
  MeetingSlot,
  MeetingStore,
  PendingCalendarEvent,
} from "./types";
import {
  CalendarAvailabilityError,
  type CalendarBusyPeriod,
  type CalendarClient,
  type CreatedCalendarEvent,
} from "@/infrastructure/google-calendar/types";
import type { Logger } from "@/infrastructure/logging/logger";
import { MEETING_CONFIG } from "./config";
import { MeetingBookingError, MeetingPersistenceError } from "./types";
import type { NotificationService } from "@/modules/notification/service";

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
    private readonly repository: MeetingStore,
    private readonly logger: Logger,
    private readonly notifications: Pick<NotificationService, "notifyMeetingBooked">,
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

  async isSlotAvailable(slot: MeetingSlot) {
    if (slot.timezone !== MEETING_CONFIG.timezone || new Date(slot.start).getTime() <= Date.now()) {
      return false;
    }

    const busy = await this.calendar.getBusyPeriods({
      start: new Date(slot.start),
      end: new Date(slot.end),
    });

    return !busy.some((period) =>
      overlaps(new Date(slot.start), new Date(slot.end), period.start, period.end),
    );
  }

  async bookMeeting(input: BookMeetingInput) {
    let stage = "meeting_lookup";

    try {
      if (!z.string().uuid().safeParse(input.bookingOperationId).success) {
        throw new MeetingBookingError("invalid_operation");
      }

      const eventId = `b${input.bookingOperationId.replaceAll("-", "").toLowerCase()}`;

      let existing: MeetingRecord | null;

      try {
        existing = await this.repository.findMeetingByGoogleEventId(eventId);
      } catch (error) {
        throw new MeetingBookingError("unavailable", error);
      }

      let event: CreatedCalendarEvent | null;

      let source = "existing";

      stage = "calendar_lookup";
      try {
        event = await this.calendar.findEvent(eventId);
      } catch (error) {
        throw new MeetingBookingError("unavailable", error);
      }

      if (existing) {
        stage = "event_validation";
        assertMatchingMeeting(existing, input, eventId);

        if (!event) {
          throw new MeetingBookingError("conflict");
        }

        assertMatchingCalendarEvent(event, input, eventId);
        this.logger.info("meeting.calendar_event_resolved", {
          bookingOperationId: input.bookingOperationId,
          googleEventId: eventId,
          source,
        });
        await this.notifications.notifyMeetingBooked(existing);

        return { googleEventId: existing.googleEventId, googleEventUrl: existing.googleEventUrl };
      }

      if (!event) {
        stage = "availability";
        let available: boolean;

        try {
          available = await this.isSlotAvailable(input.slot);
        } catch (error) {
          throw new MeetingBookingError("unavailable", error);
        }

        if (!available) {
          throw new MeetingBookingError("slot_unavailable");
        }

        try {
          stage = "calendar_insert";
          event = await this.calendar.createEvent({
            eventId,
            bookingOperationId: input.bookingOperationId,
            summary: `Meeting with ${input.name}`,
            description: input.reason,
            attendeeEmail: input.email,
            start: new Date(input.slot.start),
            end: new Date(input.slot.end),
            timezone: MEETING_CONFIG.timezone,
          });
          source = "created";
        } catch (error) {
          // Insert may have committed before its response was lost. Never mint another ID.
          try {
            stage = "calendar_lookup_after_insert";
            event = await this.calendar.findEvent(eventId);
          } catch (lookupError) {
            throw new MeetingBookingError("uncertain", lookupError);
          }

          if (!event) {
            throw new MeetingBookingError("uncertain", error);
          }

          source = "recovered";
        }
      }

      stage = "event_validation";
      assertMatchingCalendarEvent(event, input, eventId);
      this.logger.info("meeting.calendar_event_resolved", {
        bookingOperationId: input.bookingOperationId,
        googleEventId: eventId,
        source,
      });

      const pendingEvent = {
        googleEventId: event.id,
        googleEventUrl: event.htmlLink,
        rawProviderPayload: event.payload,
      };

      stage = "meeting_persistence";

      return await this.persistMeeting({ ...input, pendingEvent });
    } catch (error) {
      this.logger.error("meeting.booking_recovery_required", {
        bookingOperationId: input.bookingOperationId,
        stage,
        category:
          error instanceof MeetingBookingError
            ? error.code
            : error instanceof MeetingPersistenceError
              ? "persistence_failed"
              : "unexpected",
      });
      throw error;
    }
  }

  async reconcileMeeting(
    input: MeetingBookingDetails & {
      pendingEvent: PendingCalendarEvent;
      bookingOperationId?: string;
    },
  ) {
    let stage = "calendar_lookup";

    try {
      let event: CreatedCalendarEvent | null;

      try {
        event = await this.calendar.findEvent(input.pendingEvent.googleEventId);
      } catch (error) {
        throw new MeetingBookingError("unavailable", error);
      }

      if (!event) {
        throw new MeetingBookingError("conflict");
      }

      stage = "event_validation";
      assertMatchingCalendarEvent(event, input, input.pendingEvent.googleEventId);
      this.logger.info("meeting.calendar_event_resolved", {
        bookingOperationId: input.bookingOperationId,
        googleEventId: event.id,
        source: "existing",
      });

      stage = "meeting_persistence";

      return await this.persistMeeting({
        ...input,
        pendingEvent: {
          googleEventId: event.id,
          googleEventUrl: event.htmlLink,
          rawProviderPayload: event.payload,
        },
      });
    } catch (error) {
      this.logger.error("meeting.booking_recovery_required", {
        bookingOperationId: input.bookingOperationId,
        stage,
        category:
          error instanceof MeetingBookingError
            ? error.code
            : error instanceof MeetingPersistenceError
              ? "persistence_failed"
              : "unexpected",
      });
      throw error;
    }
  }

  private async persistMeeting(
    input: MeetingBookingDetails & { pendingEvent: PendingCalendarEvent },
  ) {
    const record: MeetingRecordInput = {
      googleEventId: input.pendingEvent.googleEventId,
      name: input.name,
      email: input.email,
      timezone: MEETING_CONFIG.timezone,
      reason: input.reason,
      startsAt: new Date(input.slot.start),
      endsAt: new Date(input.slot.end),
      status: "confirmed",
      googleEventUrl: input.pendingEvent.googleEventUrl,
      rawProviderPayload: input.pendingEvent.rawProviderPayload,
    };

    let meeting: MeetingRecord | null;

    try {
      meeting = await this.repository.findMeetingByGoogleEventId(input.pendingEvent.googleEventId);
    } catch (error) {
      throw new MeetingPersistenceError(input.pendingEvent, error);
    }

    if (meeting) {
      assertMatchingMeeting(meeting, input, input.pendingEvent.googleEventId);
    } else {
      try {
        meeting = await this.repository.createMeeting(record);
      } catch (error) {
        try {
          meeting = await this.repository.findMeetingByGoogleEventId(
            input.pendingEvent.googleEventId,
          );
        } catch (lookupError) {
          throw new MeetingPersistenceError(input.pendingEvent, lookupError);
        }

        if (!meeting) {
          throw new MeetingPersistenceError(input.pendingEvent, error);
        }

        assertMatchingMeeting(meeting, input, input.pendingEvent.googleEventId);
      }
    }

    await this.notifications.notifyMeetingBooked(meeting);

    return {
      googleEventId: input.pendingEvent.googleEventId,
      googleEventUrl: input.pendingEvent.googleEventUrl,
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

function assertMatchingMeeting(
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
