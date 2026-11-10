import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { google } from "googleapis";
import { GoogleCalendarClient } from "@/infrastructure/google-calendar/client";
import { CalendarEventError } from "@/infrastructure/google-calendar/types";

function setup(context: TestContext) {
  const calendar = google.calendar({ version: "v3" });

  const calendarApi: { calendar(options: { version: "v3" }): typeof calendar } = google;

  context.mock.method(calendarApi, "calendar", () => calendar);
  const client = new GoogleCalendarClient(() => ({
    clientId: "test-client",
    clientSecret: "test-secret",
    refreshToken: "test-refresh",
    calendarId: "test-calendar",
  }));

  return { calendar, client };
}

test("Calendar insertion sends the supplied stable ID and operation metadata with bounded transport", async (context) => {
  const { calendar, client } = setup(context);

  const insert = context.mock.method(calendar.events, "insert", async () => ({
    data: { id: "b11111111111141118111111111111111", htmlLink: "https://calendar.example/event" },
  }));

  const input = {
    eventId: "b11111111111141118111111111111111",
    bookingOperationId: "11111111-1111-4111-8111-111111111111",
    summary: "Meeting with Visitor",
    description: "Discuss a project",
    attendeeEmail: "visitor@example.com",
    start: new Date("2099-09-15T11:00:00Z"),
    end: new Date("2099-09-15T11:30:00Z"),
    timezone: "Europe/London",
  };

  assert.equal((await client.createEvent(input)).id, input.eventId);
  assert.deepEqual(insert.mock.calls[0].arguments, [
    {
      calendarId: "test-calendar",
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
    { timeout: 10_000, retry: false },
  ]);
});

test("Calendar exact lookup distinguishes 404 from unavailable or deleted events", async (context) => {
  const { calendar, client } = setup(context);

  for (const status of [404, 403, 410, 500]) {
    const get = context.mock.method(calendar.events, "get", async () => {
      throw { response: { status }, message: "Private provider details" };
    });

    if (status === 404) {
      assert.equal(await client.findEvent("stable-event"), null);
    } else {
      await assert.rejects(client.findEvent("stable-event"), (error: unknown) => {
        assert.ok(error instanceof CalendarEventError);
        assert.equal(error.message.includes("Private"), false);

        return true;
      });
    }

    assert.deepEqual(get.mock.calls[0].arguments, [
      { calendarId: "test-calendar", eventId: "stable-event" },
      { timeout: 10_000, retry: false },
    ]);
    get.mock.restore();
  }
});

test("Calendar malformed success payloads are failures, not absent events", async (context) => {
  const { calendar, client } = setup(context);

  for (const data of [{}, { id: "" }, { id: "event", htmlLink: "not-a-url" }]) {
    const get = context.mock.method(calendar.events, "get", async () => ({ data }));

    await assert.rejects(client.findEvent("event"), CalendarEventError);
    get.mock.restore();
  }
});

test("Calendar insertion failures expose only a safe typed error", async (context) => {
  const { calendar, client } = setup(context);

  context.mock.method(calendar.events, "insert", async () => {
    throw new Error("Private OAuth provider details");
  });
  await assert.rejects(
    client.createEvent({
      eventId: "stable-event",
      bookingOperationId: "operation-id",
      summary: "Summary",
      description: "Reason",
      attendeeEmail: "visitor@example.com",
      start: new Date(),
      end: new Date(),
      timezone: "Europe/London",
    }),
    (error: unknown) => {
      assert.ok(error instanceof CalendarEventError);
      assert.equal(error.message.includes("Private"), false);

      return true;
    },
  );
});

test("Calendar adapter preserves a rejection versus a potentially committed insert", async (context) => {
  const { calendar, client } = setup(context);

  const { signal } = new AbortController();

  for (const [status, reason, outcome] of [
    [400, "timeRangeEmpty", "rejected"],
    [401, "authError", "rejected"],
    [403, "forbidden", "rejected"],
    [403, "userRateLimitExceeded", "rate_limited"],
    [403, "rateLimitExceeded", "rate_limited"],
    [404, "notFound", "rejected"],
    [409, "duplicate", "uncertain"],
    [429, "rateLimitExceeded", "rate_limited"],
    [503, "backendError", "uncertain"],
  ] as const) {
    const insert = context.mock.method(calendar.events, "insert", async () => {
      throw { response: { status, data: { error: { errors: [{ reason }] } } } };
    });

    await assert.rejects(
      client.createEvent(
        {
          eventId: "stable-event",
          bookingOperationId: "operation-id",
          summary: "Summary",
          description: "Reason",
          attendeeEmail: "visitor@example.com",
          start: new Date(),
          end: new Date(),
          timezone: "Europe/London",
        },
        signal,
      ),
      (error: unknown) => {
        assert.ok(error instanceof CalendarEventError);
        assert.equal(error.outcome, outcome);

        return true;
      },
    );
    assert.deepEqual(Array.from(insert.mock.calls[0].arguments)[1], {
      timeout: 10_000,
      retry: false,
      signal,
    });
    insert.mock.restore();
  }
});

test("Calendar deadline bounds a request that stalls before transport", async (context) => {
  const { calendar, client } = setup(context);

  const controller = new AbortController();

  const ready = Promise.withResolvers<void>();

  context.mock.method(calendar.events, "get", () => {
    ready.resolve();

    return new Promise(() => {});
  });
  const result = client.findEvent("stable-event", controller.signal);

  await ready.promise;
  controller.abort();
  await assert.rejects(result, CalendarEventError);
});

test("Calendar availability checks also use bounded non-retrying transport", async (context) => {
  const { calendar, client } = setup(context);

  const query = context.mock.method(calendar.freebusy, "query", async () => ({
    data: { calendars: { "test-calendar": { busy: [] } } },
  }));

  await client.getBusyPeriods({
    start: new Date("2099-09-15T11:00:00Z"),
    end: new Date("2099-09-15T11:30:00Z"),
  });
  assert.deepEqual(query.mock.calls[0].arguments, [
    {
      requestBody: {
        timeMin: "2099-09-15T11:00:00.000Z",
        timeMax: "2099-09-15T11:30:00.000Z",
        items: [{ id: "test-calendar" }],
      },
    },
    { timeout: 10_000, retry: false },
  ]);
});
