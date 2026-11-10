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

const providerErrorSchema = z.object({
  error: z.object({ errors: z.array(z.object({ reason: z.string() })) }),
});

const requestOptions = { timeout: 10_000, retry: false } as const;

export class GoogleCalendarClient implements CalendarClient {
  private calendar: ReturnType<typeof google.calendar> | null = null;

  private calendarId: string | null = null;

  constructor(private readonly getConfig: () => GoogleCalendarConfig) {}

  async getBusyPeriods(
    input: { start: Date; end: Date },
    signal?: AbortSignal,
  ): Promise<CalendarBusyPeriod[]> {
    try {
      const { calendar, calendarId } = this.getCalendar();

      const response = await withSignal(signal, () =>
        calendar.freebusy.query(
          {
            requestBody: {
              timeMin: input.start.toISOString(),
              timeMax: input.end.toISOString(),
              items: [{ id: calendarId }],
            },
          },
          signal ? { ...requestOptions, signal } : requestOptions,
        ),
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

  async findEvent(eventId: string, signal?: AbortSignal): Promise<CreatedCalendarEvent | null> {
    try {
      const { calendar, calendarId } = this.getCalendar();

      const response = await withSignal(signal, () =>
        calendar.events.get(
          { calendarId, eventId },
          signal ? { ...requestOptions, signal } : requestOptions,
        ),
      );

      return toCalendarEvent(response.data);
    } catch (error) {
      if (responseStatus(error) === 404) {
        return null;
      }

      throw new CalendarEventError(error);
    }
  }

  async createEvent(
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
  ): Promise<CreatedCalendarEvent> {
    try {
      const { calendar, calendarId } = this.getCalendar();

      const response = await withSignal(signal, () =>
        calendar.events.insert(
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
          signal ? { ...requestOptions, signal } : requestOptions,
        ),
      );

      return toCalendarEvent(response.data);
    } catch (error) {
      throw new CalendarEventError(error, insertionOutcome(error));
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

function responseDetails(error: unknown) {
  if (typeof error !== "object" || !error || !("response" in error)) {
    return undefined;
  }

  const response = error.response;

  return typeof response === "object" && response ? response : undefined;
}

function responseStatus(error: unknown) {
  const response = responseDetails(error);

  return response && "status" in response ? response.status : undefined;
}

function insertionOutcome(error: unknown) {
  const status = responseStatus(error);

  if (status === 429) {
    return "rate_limited";
  }

  if (status === 403) {
    const response = responseDetails(error);

    const parsed = providerErrorSchema.safeParse(
      response && "data" in response ? response.data : null,
    );

    if (
      parsed.success &&
      parsed.data.error.errors.some(
        ({ reason }) => reason === "rateLimitExceeded" || reason === "userRateLimitExceeded",
      )
    ) {
      return "rate_limited";
    }

    return "rejected";
  }

  return status === 400 || status === 401 || status === 404 ? "rejected" : "uncertain";
}

async function withSignal<Result>(signal: AbortSignal | undefined, request: () => Promise<Result>) {
  if (!signal) {
    return request();
  }

  signal.throwIfAborted();
  const aborted = Promise.withResolvers<never>();

  const abort = () => aborted.reject(signal.reason);

  signal.addEventListener("abort", abort, { once: true });
  try {
    // OAuth refresh can precede the request's own signal-aware transport.
    return await Promise.race([request(), aborted.promise]);
  } finally {
    signal.removeEventListener("abort", abort);
  }
}
