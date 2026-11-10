import assert from "node:assert/strict";
import test from "node:test";
import { google } from "googleapis";
import { GoogleCalendarClient } from "@/infrastructure/google-calendar/client";
import { CalendarAvailabilityError } from "@/infrastructure/google-calendar/types";
import type { CalendarClient } from "@/infrastructure/google-calendar/types";
import { MeetingService } from "@/modules/meeting/service";
import { MeetingBookingWorkflowDefinition } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.definition";
import { MeetingBookingWorkflowProgressProjector } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.progress";

test("today is accepted while a wholly past availability range is rejected", async () => {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("/", "-");

  const service = {
    findAvailableSlots: async () => [],
    isSlotAvailable: async () => true,
    bookMeeting: async () => ({ googleEventId: "event", googleEventUrl: null }),
    reconcileMeeting: async () => ({ googleEventId: "event", googleEventUrl: null }),
  };

  const workflow = new MeetingBookingWorkflowDefinition(
    service,
    new MeetingBookingWorkflowProgressProjector(),
  );

  const state = workflow.createInitialState({
    originChannel: "test",
    originPage: null,
    originEntry: null,
  });

  const sameDay = await workflow.executeTool(
    "find_meeting_slots",
    JSON.stringify({ startDate: today, endDate: today }),
    state,
    {
      workflowInstanceId: "11111111-1111-4111-8111-111111111111",
      interactionId: "33333333-3333-4333-8333-333333333333",
    },
  );

  const past = await workflow.executeTool(
    "find_meeting_slots",
    JSON.stringify({ startDate: "2020-01-01", endDate: "2020-01-01" }),
    state,
    {
      workflowInstanceId: "11111111-1111-4111-8111-111111111111",
      interactionId: "33333333-3333-4333-8333-333333333333",
    },
  );

  assert.equal(sameDay.output.kind, "meeting_slots");
  assert.equal(past.output.error, "invalid_date_range");
});

test("elapsed slots skip Calendar and provider failures stay unavailable with safe logging", async () => {
  let queries = 0;

  const errors: Array<{ event: string; context: unknown }> = [];

  const calendar: CalendarClient = {
    findEvent: async () => null,
    getBusyPeriods: async () => {
      queries += 1;

      throw new CalendarAvailabilityError(new Error("Private OAuth payload"));
    },
    createEvent: async () => ({ id: "event", htmlLink: null, payload: {} }),
  };

  const service = new MeetingService(calendar, {
    info: () => undefined,
    error: (event, context) => errors.push({ event, context }),
  });

  assert.equal(
    await service.isSlotAvailable({
      start: "2020-01-01T12:00:00.000Z",
      end: "2020-01-01T12:30:00.000Z",
      timezone: "Europe/London",
    }),
    false,
  );
  assert.equal(queries, 0);
  await assert.rejects(
    service.findAvailableSlots({ startDate: "2099-09-15", endDate: "2099-09-15" }),
    CalendarAvailabilityError,
  );
  assert.equal(queries, 1);
  assert.deepEqual(errors, [
    { event: "meeting.availability_failed", context: { category: "calendar_unavailable" } },
  ]);
});

test("Calendar failures and incomplete busy results never become free time", async (context) => {
  const calendar = google.calendar({ version: "v3" });

  const calendarApi: { calendar(options: { version: "v3" }): typeof calendar } = google;

  context.mock.method(calendarApi, "calendar", () => calendar);
  const client = new GoogleCalendarClient(() => ({
    clientId: "test-client",
    clientSecret: "test-secret",
    refreshToken: "test-refresh",
    calendarId: "test-calendar",
  }));

  const range = {
    start: new Date("2099-09-15T11:00:00Z"),
    end: new Date("2099-09-15T12:00:00Z"),
  };

  for (const data of [
    {},
    { calendars: {} },
    { calendars: { "test-calendar": { errors: [{ reason: "notFound" }], busy: [] } } },
    { calendars: { "test-calendar": {} } },
    { calendars: { "test-calendar": { busy: [{ start: "invalid", end: "invalid" }] } } },
    { calendars: { "test-calendar": { busy: [{ start: "2099-09-15T12:00:00Z" }] } } },
  ]) {
    const query = context.mock.method(calendar.freebusy, "query", async () => ({ data }));

    await assert.rejects(client.getBusyPeriods(range), CalendarAvailabilityError);
    query.mock.restore();
  }

  context.mock.method(calendar.freebusy, "query", async () => {
    throw new Error("Private OAuth provider details");
  });
  await assert.rejects(client.getBusyPeriods(range), (error: unknown) => {
    assert.ok(error instanceof CalendarAvailabilityError);
    assert.equal(error.message, "Calendar availability is temporarily unavailable.");

    return true;
  });
});

test("Calendar distinguishes a verified empty schedule from valid busy periods", async (context) => {
  const calendar = google.calendar({ version: "v3" });

  const calendarApi: { calendar(options: { version: "v3" }): typeof calendar } = google;

  context.mock.method(calendarApi, "calendar", () => calendar);
  const client = new GoogleCalendarClient(() => ({
    clientId: "test-client",
    clientSecret: "test-secret",
    refreshToken: "test-refresh",
    calendarId: "test-calendar",
  }));

  const range = {
    start: new Date("2099-09-15T11:00:00Z"),
    end: new Date("2099-09-15T12:00:00Z"),
  };

  const empty = context.mock.method(calendar.freebusy, "query", async () => ({
    data: { calendars: { "test-calendar": { busy: [] } } },
  }));

  assert.deepEqual(await client.getBusyPeriods(range), []);
  empty.mock.restore();
  context.mock.method(calendar.freebusy, "query", async () => ({
    data: {
      calendars: {
        "test-calendar": {
          busy: [{ start: range.start.toISOString(), end: range.end.toISOString() }],
        },
      },
    },
  }));
  assert.deepEqual(await client.getBusyPeriods(range), [range]);
});
