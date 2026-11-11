export type CalendarBusyPeriod = { start: Date; end: Date };
import type { Prisma } from "@/generated/prisma/client";

export class CalendarAvailabilityError extends Error {
  constructor(cause?: unknown) {
    super("Calendar availability is temporarily unavailable.", { cause });
  }
}

export class CalendarEventError extends Error {
  constructor(
    cause?: unknown,
    readonly outcome: "retry" | "terminal" | "uncertain" = "uncertain",
  ) {
    super("Calendar event lookup or creation is temporarily unavailable.", { cause });
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
  getBusyPeriods(
    input: { start: Date; end: Date },
    signal?: AbortSignal,
  ): Promise<CalendarBusyPeriod[]>;
  findEvent(eventId: string, signal?: AbortSignal): Promise<CreatedCalendarEvent | null>;
  createEvent(
    input: {
      eventId: string;
      bookingOperationId: string;
      summary: string;
      description: string;
      attendeeEmail: string;
      start: Date;
      end: Date;
      timezone: string;
    },
    signal?: AbortSignal,
  ): Promise<CreatedCalendarEvent>;
};
