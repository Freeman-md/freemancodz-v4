import { MeetingPersistenceError, type MeetingStore } from "./v1-meeting-store";
import { z } from "zod";
import type { CalendarClient, CreatedCalendarEvent } from "@/infrastructure/google-calendar/types";
import type { Logger } from "@/infrastructure/logging/logger";
import { MEETING_CONFIG } from "@/modules/meeting/config";
import { MeetingService } from "@/modules/meeting/service";
import {
  MeetingBookingError,
  type BookMeetingInput,
  type MeetingBookingDetails,
  type MeetingRecord,
  type MeetingRecordInput,
  type PendingCalendarEvent,
} from "@/modules/meeting/types";

export class V1MeetingService extends MeetingService {
  constructor(
    private readonly v1Calendar: CalendarClient,
    private readonly v1Repository: MeetingStore,
    private readonly v1Logger: Logger,
    private readonly notifications: { notifyMeetingBooked(meeting: MeetingRecord): Promise<void> },
  ) {
    super(v1Calendar, v1Logger);
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
        existing = await this.v1Repository.findMeetingByGoogleEventId(eventId);
      } catch (error) {
        throw new MeetingBookingError("unavailable", error);
      }

      let event: CreatedCalendarEvent | null;

      let source = "existing";

      stage = "calendar_lookup";
      try {
        event = await this.v1Calendar.findEvent(eventId);
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
        this.v1Logger.info("meeting.calendar_event_resolved", {
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
          event = await this.v1Calendar.createEvent({
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
            event = await this.v1Calendar.findEvent(eventId);
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
      this.v1Logger.info("meeting.calendar_event_resolved", {
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
      this.v1Logger.error("meeting.booking_recovery_required", {
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
        event = await this.v1Calendar.findEvent(input.pendingEvent.googleEventId);
      } catch (error) {
        throw new MeetingBookingError("unavailable", error);
      }

      if (!event) {
        throw new MeetingBookingError("conflict");
      }

      stage = "event_validation";
      assertMatchingCalendarEvent(event, input, input.pendingEvent.googleEventId);
      this.v1Logger.info("meeting.calendar_event_resolved", {
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
      this.v1Logger.error("meeting.booking_recovery_required", {
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
      meeting = await this.v1Repository.findMeetingByGoogleEventId(
        input.pendingEvent.googleEventId,
      );
    } catch (error) {
      throw new MeetingPersistenceError(input.pendingEvent, error);
    }

    if (meeting) {
      assertMatchingMeeting(meeting, input, input.pendingEvent.googleEventId);
    } else {
      try {
        meeting = await this.v1Repository.createMeeting(record);
      } catch (error) {
        try {
          meeting = await this.v1Repository.findMeetingByGoogleEventId(
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
}

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
