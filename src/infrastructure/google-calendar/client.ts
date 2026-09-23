import "server-only";
import { google } from "googleapis";
import type {
  CalendarBusyPeriod,
  CalendarClient,
  CreatedCalendarEvent,
  GoogleCalendarConfig,
} from "./types";
import { createHash } from "node:crypto";

export class GoogleCalendarClient implements CalendarClient {
  private calendar: ReturnType<typeof google.calendar> | null = null;

  private calendarId: string | null = null;

  constructor(private readonly getConfig: () => GoogleCalendarConfig) {}

  async getBusyPeriods(input: { start: Date; end: Date }): Promise<CalendarBusyPeriod[]> {
    const { calendar, calendarId } = this.getCalendar();

    try {
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: input.start.toISOString(),
          timeMax: input.end.toISOString(),
          items: [{ id: calendarId }],
        },
      });

      const periods = response.data.calendars?.[calendarId]?.busy ?? [];

      return periods.flatMap((period) =>
        period.start && period.end
          ? [{ start: new Date(period.start), end: new Date(period.end) }]
          : [],
      );
    } catch (error) {
      throw new Error("Google Calendar availability request failed.", { cause: error });
    }
  }

  async createEvent(input: {
    summary: string;
    description: string;
    attendeeEmail: string;
    start: Date;
    end: Date;
    timezone: string;
  }): Promise<CreatedCalendarEvent> {
    const { calendar, calendarId } = this.getCalendar();

    try {
      const response = await calendar.events.insert({
        calendarId,
        sendUpdates: "all",
        requestBody: {
          summary: input.summary,
          description: input.description,
          attendees: [{ email: input.attendeeEmail }],
          start: { dateTime: input.start.toISOString(), timeZone: input.timezone },
          end: { dateTime: input.end.toISOString(), timeZone: input.timezone },
        },
      });

      if (!response.data.id) {
        throw new Error("Google Calendar did not return an event ID.");
      }

      return {
        id: response.data.id,
        htmlLink: response.data.htmlLink ?? null,
        payload: JSON.parse(
          JSON.stringify(response.data),
        ) as import("@/generated/prisma/client").Prisma.JsonObject,
      };
    } catch (error) {
      throw new Error("Google Calendar event creation failed.", { cause: error });
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
