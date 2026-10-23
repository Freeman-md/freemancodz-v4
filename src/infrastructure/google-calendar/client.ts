import "server-only";
import { google } from "googleapis";
import { z } from "zod";
import {
  CalendarAvailabilityError,
  CalendarEventError,
  type CalendarBusyPeriod,
  type CalendarClient,
  type CreatedCalendarEvent,
  type GoogleCalendarConfig,
} from "./types";

const eventPayloadSchema = z.record(z.string(), z.json());

const requestOptions = { timeout: 10_000, retry: false } as const;

export class GoogleCalendarClient implements CalendarClient {
  private calendar: ReturnType<typeof google.calendar> | null = null;

  private calendarId: string | null = null;

  constructor(private readonly getConfig: () => GoogleCalendarConfig) {}

  async getBusyPeriods(input: { start: Date; end: Date }): Promise<CalendarBusyPeriod[]> {
    try {
      const { calendar, calendarId } = this.getCalendar();

      const response = await calendar.freebusy.query(
        {
          requestBody: {
            timeMin: input.start.toISOString(),
            timeMax: input.end.toISOString(),
            items: [{ id: calendarId }],
          },
        },
        requestOptions,
      );

      const result = response.data.calendars?.[calendarId];

      // A failed or missing Calendar result is not evidence that the time is free.
      if (!result || result.errors?.length || !Array.isArray(result.busy)) {
        throw new CalendarAvailabilityError();
      }

      const periods = result.busy;

      return periods.map((period) => {
        const start = new Date(period.start ?? "");

        const end = new Date(period.end ?? "");

        if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
          throw new CalendarAvailabilityError();
        }

        return { start, end };
      });
    } catch (error) {
      throw new CalendarAvailabilityError(error);
    }
  }

  async findEvent(eventId: string): Promise<CreatedCalendarEvent | null> {
    try {
      const { calendar, calendarId } = this.getCalendar();

      const response = await calendar.events.get({ calendarId, eventId }, requestOptions);

      return toCalendarEvent(response.data);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "status" in error.response &&
        error.response.status === 404
      ) {
        return null;
      }

      throw new CalendarEventError(error);
    }
  }

  async createEvent(input: {
    eventId: string;
    bookingOperationId: string;
    summary: string;
    description: string;
    attendeeEmail: string;
    start: Date;
    end: Date;
    timezone: string;
  }): Promise<CreatedCalendarEvent> {
    try {
      const { calendar, calendarId } = this.getCalendar();

      const response = await calendar.events.insert(
        {
          calendarId,
          sendUpdates: "all",
          requestBody: {
            id: input.eventId,
            extendedProperties: { private: { bookingOperationId: input.bookingOperationId } },
            summary: input.summary,
            description: input.description,
            attendees: [{ email: input.attendeeEmail }],
            start: { dateTime: input.start.toISOString(), timeZone: input.timezone },
            end: { dateTime: input.end.toISOString(), timeZone: input.timezone },
          },
        },
        requestOptions,
      );

      return toCalendarEvent(response.data);
    } catch (error) {
      throw new CalendarEventError(error);
    }
  }

  private getCalendar() {
    if (this.calendar && this.calendarId) {
      return { calendar: this.calendar, calendarId: this.calendarId };
    }

    const config = this.getConfig();

    const auth = new google.auth.OAuth2(config.clientId, config.clientSecret);

    auth.setCredentials({ refresh_token: config.refreshToken });
    this.calendar = google.calendar({ version: "v3", auth });
    this.calendarId = config.calendarId;

    return { calendar: this.calendar, calendarId: this.calendarId };
  }
}

function toCalendarEvent(data: unknown): CreatedCalendarEvent {
  const payload = eventPayloadSchema.parse(data);

  const id = z.string().min(1).parse(payload.id);

  const htmlLink = z.string().url().nullish().parse(payload.htmlLink) ?? null;

  return { id, htmlLink, payload };
}
