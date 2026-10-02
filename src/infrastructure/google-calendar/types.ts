export type CalendarBusyPeriod = { start: Date; end: Date };
import type { Prisma } from "@/generated/prisma/client";

export class CalendarAvailabilityError extends Error {
  constructor(cause?: unknown) {
    super("Calendar availability is temporarily unavailable.", { cause });
  }
}

export type CreatedCalendarEvent = {
  id: string;
  htmlLink: string | null;
  payload: Prisma.JsonObject;
};

export type GoogleCalendarConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
};

export type CalendarClient = {
  getBusyPeriods(input: { start: Date; end: Date }): Promise<CalendarBusyPeriod[]>;
  createEvent(input: {
    summary: string;
    description: string;
    attendeeEmail: string;
    start: Date;
    end: Date;
    timezone: string;
  }): Promise<CreatedCalendarEvent>;
};
