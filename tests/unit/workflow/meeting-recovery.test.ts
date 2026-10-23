import assert from "node:assert/strict";
import test from "node:test";
import type { CalendarClient, CreatedCalendarEvent } from "@/infrastructure/google-calendar/types";
import { MeetingService } from "@/modules/meeting/service";
import {
  MeetingBookingError,
  MeetingPersistenceError,
  type BookMeetingInput,
  type MeetingRecord,
  type MeetingStore,
} from "@/modules/meeting/types";

const input: BookMeetingInput = {
  bookingOperationId: "11111111-1111-4111-8111-111111111111",
  name: "Visitor",
  email: "visitor@example.com",
  reason: "Discuss a project",
  slot: {
    start: "2099-09-15T11:00:00.000Z",
    end: "2099-09-15T11:30:00.000Z",
    timezone: "Europe/London",
  },
};

const eventId = "b11111111111141118111111111111111";

const bookingDetails = {
  name: input.name,
  email: input.email,
  reason: input.reason,
  slot: input.slot,
};

function event(includeOperation = true): CreatedCalendarEvent {
  return {
    id: eventId,
    htmlLink: "https://calendar.example/event",
    payload: {
      id: eventId,
      status: "confirmed",
      summary: `Meeting with ${input.name}`,
      description: input.reason,
      attendees: [{ email: input.email }],
      start: { dateTime: input.slot.start, timeZone: input.slot.timezone },
      end: { dateTime: input.slot.end, timeZone: input.slot.timezone },
      ...(includeOperation
        ? { extendedProperties: { private: { bookingOperationId: input.bookingOperationId } } }
        : {}),
    },
  };
}

function harness(
  overrides: {
    calendar?: Partial<CalendarClient>;
    repository?: Partial<MeetingStore>;
  } = {},
) {
  const calls: string[] = [];

  const events = new Map<string, CreatedCalendarEvent>();

  const records = new Map<string, MeetingRecord>();

  const notifications: string[] = [];

  const logs: Array<{ event: string; context: unknown }> = [];

  const calendar: CalendarClient = {
    findEvent: async (id) => {
      calls.push(`find:${id}`);

      return events.get(id) ?? null;
    },
    getBusyPeriods: async () => {
      calls.push("busy");

      return [];
    },
    createEvent: async (request) => {
      calls.push(`create:${request.eventId}`);
      assert.equal(request.bookingOperationId, input.bookingOperationId);
      const created = event();

      events.set(created.id, created);

      return created;
    },
    ...overrides.calendar,
  };

  const repository: MeetingStore = {
    findMeetingByGoogleEventId: async (id) => records.get(id) ?? null,
    createMeeting: async (record) => {
      if (records.has(record.googleEventId)) {
        throw new Error("unique constraint");
      }

      const stored = {
        ...record,
        rawProviderPayload: event().payload,
        id: "meeting-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      records.set(record.googleEventId, stored);

      return stored;
    },
    updateMeeting: async () => {
      throw new Error("Must not overwrite an existing booking");
    },
    ...overrides.repository,
  };

  const service = new MeetingService(
    calendar,
    repository,
    {
      info: (event, context) => {
        logs.push({ event, context });
      },
      error: (event, context) => {
        logs.push({ event, context });
      },
    },
    {
      notifyMeetingBooked: async (record) => {
        notifications.push(record.id);
      },
    },
  );

  return { service, calendar, repository, calls, events, records, notifications, logs };
}

test("recovery diagnostics identify stages without personal or provider data", async () => {
  for (const stage of [
    "calendar_lookup",
    "availability",
    "calendar_insert",
    "meeting_persistence",
  ] as const) {
    const setup = harness();

    if (stage === "calendar_lookup")
      {setup.calendar.findEvent = async () => {
        throw new Error("PRIVATE_PROVIDER_PAYLOAD");
      };}

    if (stage === "availability")
      {setup.calendar.getBusyPeriods = async () => {
        throw new Error("PRIVATE_PROVIDER_PAYLOAD");
      };}

    if (stage === "calendar_insert")
      {setup.calendar.createEvent = async () => {
        throw new Error("PRIVATE_PROVIDER_PAYLOAD");
      };}

    if (stage === "meeting_persistence")
      {setup.repository.createMeeting = async () => {
        throw new Error("PRIVATE_PROVIDER_PAYLOAD");
      };}

    await assert.rejects(setup.service.bookMeeting(input));
    const failure = setup.logs.find((log) => log.event === "meeting.booking_recovery_required");

    assert.ok(failure);
    assert.match(
      JSON.stringify(failure),
      new RegExp(stage === "calendar_insert" ? "calendar_lookup_after_insert" : stage),
    );
    assert.match(JSON.stringify(failure), new RegExp(input.bookingOperationId));
    assert.doesNotMatch(
      JSON.stringify(setup.logs),
      /visitor@example.com|Discuss a project|PRIVATE_PROVIDER_PAYLOAD|stack|cause/,
    );
  }

  const setup = harness();

  await setup.service.bookMeeting(input);
  await setup.service.bookMeeting(input);
  assert.deepEqual(
    setup.logs
      .filter((log) => log.event === "meeting.calendar_event_resolved")
      .map((log) => (log.context as { source: string }).source),
    ["created", "existing"],
  );
});

test("an insert with a lost response recovers by the same event ID and reuses its Meeting", async () => {
  const setup = harness();

  const create = setup.calendar.createEvent;

  setup.calendar.createEvent = async (request) => {
    await create(request);
    throw new Error("Private provider failure");
  };

  assert.deepEqual(await setup.service.bookMeeting(input), {
    googleEventId: eventId,
    googleEventUrl: "https://calendar.example/event",
  });
  await setup.service.bookMeeting(input);

  assert.deepEqual(setup.calls, [
    `find:${eventId}`,
    "busy",
    `create:${eventId}`,
    `find:${eventId}`,
    `find:${eventId}`,
  ]);
  assert.equal(setup.records.size, 1);
  assert.deepEqual(setup.notifications, ["meeting-1", "meeting-1"]);
});

test("a persistence retry finds its own Calendar event before checking busy time", async () => {
  const setup = harness();

  const create = setup.repository.createMeeting;

  let attempts = 0;

  setup.repository.createMeeting = async (record) => {
    attempts += 1;
    if (attempts === 1) {
      throw new Error("Database unavailable");
    }

    return create(record);
  };

  await assert.rejects(setup.service.bookMeeting(input), MeetingPersistenceError);
  setup.calendar.getBusyPeriods = async () => {
    throw new Error("Own event must not be rechecked");
  };

  await setup.service.bookMeeting(input);

  assert.equal(setup.calls.filter((call) => call.startsWith("create:")).length, 1);
  assert.equal(setup.calls.filter((call) => call === "busy").length, 1);
  assert.equal(setup.records.size, 1);
});

test("unknown insertion outcomes keep the same deterministic ID on every retry", async () => {
  const ids: string[] = [];

  const setup = harness({
    calendar: {
      createEvent: async (request) => {
        ids.push(request.eventId);
        throw new Error("Private provider failure");
      },
    },
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await assert.rejects(setup.service.bookMeeting(input), (error: unknown) => {
      assert.ok(error instanceof MeetingBookingError);
      assert.equal(error.code, "uncertain");
      assert.equal(error.message.includes("Private"), false);

      return true;
    });
  }

  assert.deepEqual(ids, [eventId, eventId]);
  assert.equal(setup.records.size, 0);
});

test("a failed lookup after an uncertain insertion stays uncertain without recording success", async () => {
  let lookups = 0;

  const setup = harness({
    calendar: {
      findEvent: async () => {
        lookups += 1;
        if (lookups === 1) {
          return null;
        }

        throw new Error("Private lookup failure");
      },
      createEvent: async () => {
        throw new Error("Private insertion failure");
      },
    },
  });

  await assert.rejects(setup.service.bookMeeting(input), (error: unknown) => {
    assert.ok(error instanceof MeetingBookingError);
    assert.equal(error.code, "uncertain");

    return true;
  });
  assert.equal(setup.records.size, 0);
  assert.deepEqual(setup.notifications, []);
});

test("unavailable lookup and busy slots never permit insertion", async () => {
  for (const calendar of [
    {
      findEvent: async () => {
        throw new Error("Private lookup failure");
      },
    },
    {
      getBusyPeriods: async () => [
        { start: new Date(input.slot.start), end: new Date(input.slot.end) },
      ],
    },
  ]) {
    const setup = harness({ calendar });

    await assert.rejects(setup.service.bookMeeting(input), MeetingBookingError);
    assert.equal(
      setup.calls.some((call) => call.startsWith("create:")),
      false,
    );
  }
});

test("recovered Calendar events must match the operation and confirmed details", async () => {
  const valid = event();

  for (const payload of [
    { ...valid.payload, id: "another-event" },
    { ...valid.payload, status: "cancelled" },
    { ...valid.payload, summary: "Another visitor" },
    { ...valid.payload, description: "Different topic" },
    { ...valid.payload, attendees: [{ email: "other@example.com" }] },
    { ...valid.payload, start: { dateTime: input.slot.end, timeZone: input.slot.timezone } },
    { ...valid.payload, end: { dateTime: input.slot.end, timeZone: "UTC" } },
    { ...valid.payload, extendedProperties: { private: { bookingOperationId: "other" } } },
    {},
  ]) {
    const setup = harness({ calendar: { findEvent: async () => ({ ...valid, payload }) } });

    await assert.rejects(setup.service.bookMeeting(input), (error: unknown) => {
      assert.ok(error instanceof MeetingBookingError);
      assert.equal(error.code, "conflict");

      return true;
    });
    assert.equal(setup.records.size, 0);
    assert.deepEqual(setup.notifications, []);
  }
});

test("an existing mismatching or cancelled Meeting is never overwritten or reported as booked", async () => {
  for (const change of [
    { email: "other@example.com" },
    { status: "cancelled" },
    { reason: "Other" },
  ]) {
    const setup = harness();

    await setup.service.bookMeeting(input);
    const record = setup.records.get(eventId)!;

    setup.records.set(eventId, { ...record, ...change });
    setup.notifications.length = 0;
    await assert.rejects(setup.service.bookMeeting(input), MeetingBookingError);
    assert.deepEqual(setup.notifications, []);
    assert.deepEqual(setup.records.get(eventId), { ...record, ...change });
  }
});

test("an internal Meeting cannot hide a missing, cancelled or changed Calendar event", async () => {
  for (const providerEvent of [
    null,
    { ...event(), payload: { ...event().payload, status: "cancelled" } },
  ]) {
    const setup = harness();

    await setup.service.bookMeeting(input);
    setup.calendar.findEvent = async () => providerEvent;
    setup.notifications.length = 0;
    await assert.rejects(setup.service.bookMeeting(input), MeetingBookingError);
    assert.deepEqual(setup.notifications, []);
    assert.equal(setup.calls.filter((call) => call.startsWith("create:")).length, 1);
  }
});

test("concurrent retries converge on one provider event and one Meeting row", async () => {
  const setup = harness();

  const create = setup.calendar.createEvent;

  setup.calendar.createEvent = async (request) => {
    if (setup.events.has(request.eventId)) {
      throw new Error("Provider duplicate ID conflict");
    }

    return create(request);
  };

  const results = await Promise.all([
    setup.service.bookMeeting(input),
    setup.service.bookMeeting(input),
  ]);

  assert.deepEqual(results[0], results[1]);
  assert.equal(setup.events.size, 1);
  assert.equal(setup.records.size, 1);
  assert.deepEqual(setup.notifications, ["meeting-1", "meeting-1"]);
});

test("a database insert that committed before failing reconciles the same matching row", async () => {
  const setup = harness();

  const create = setup.repository.createMeeting;

  setup.repository.createMeeting = async (record) => {
    await create(record);
    throw new Error("Lost database response");
  };

  await setup.service.bookMeeting(input);
  assert.equal(setup.records.size, 1);
  assert.deepEqual(setup.notifications, ["meeting-1"]);
});

test("legacy reconciliation wraps a failing recovery lookup without losing its known event", async () => {
  const setup = harness({
    repository: {
      createMeeting: async () => {
        throw new Error("Private write failure");
      },
      findMeetingByGoogleEventId: async () => {
        throw new Error("Private read failure");
      },
    },
  });

  setup.events.set(eventId, event(false));

  const pendingEvent = { googleEventId: eventId, googleEventUrl: null, rawProviderPayload: {} };

  await assert.rejects(
    setup.service.reconcileMeeting({ ...bookingDetails, pendingEvent }),
    (error: unknown) => {
      assert.ok(error instanceof MeetingPersistenceError);
      assert.equal(error.pendingEvent.googleEventId, pendingEvent.googleEventId);
      assert.equal(error.message.includes("Private"), false);

      return true;
    },
  );
  assert.deepEqual(setup.calls, [`find:${eventId}`]);
});

test("legacy reconciliation reuses only a matching existing Meeting without another insert", async () => {
  const setup = harness();

  await setup.service.bookMeeting(input);
  setup.repository.createMeeting = async () => {
    throw new Error("Unexpected duplicate insert");
  };

  const pendingEvent = {
    googleEventId: eventId,
    googleEventUrl: event().htmlLink,
    rawProviderPayload: event().payload,
  };

  setup.events.set(eventId, event(false));
  await setup.service.reconcileMeeting({ ...bookingDetails, pendingEvent });
  assert.equal(setup.records.size, 1);

  const record = setup.records.get(eventId)!;

  setup.records.set(eventId, { ...record, status: "cancelled" });
  await assert.rejects(
    setup.service.reconcileMeeting({ ...bookingDetails, pendingEvent }),
    MeetingBookingError,
  );
});

test("pending recovery validates the current provider event and never inserts a replacement", async () => {
  const pendingEvent = {
    googleEventId: eventId,
    googleEventUrl: event().htmlLink,
    rawProviderPayload: event().payload,
  };

  for (const providerEvent of [
    null,
    { ...event(), payload: { ...event().payload, status: "cancelled" } },
    { ...event(), payload: { ...event().payload, attendees: [{ email: "other@example.com" }] } },
    {
      ...event(),
      payload: {
        ...event().payload,
        start: { dateTime: input.slot.end, timeZone: input.slot.timezone },
      },
    },
    event(false),
  ]) {
    const setup = harness({ calendar: { findEvent: async () => providerEvent } });

    await assert.rejects(
      setup.service.reconcileMeeting({ ...input, pendingEvent }),
      MeetingBookingError,
    );
    assert.equal(setup.records.size, 0);
    assert.deepEqual(setup.notifications, []);
    assert.equal(
      setup.calls.some((call) => call.startsWith("create:")),
      false,
    );
    assert.equal(setup.calls.includes("busy"), false);
  }
});

test("pending recovery treats unavailable provider lookup as failure without recording or insertion", async () => {
  const setup = harness({
    calendar: {
      findEvent: async () => {
        throw new Error("Private provider error");
      },
    },
  });

  const pendingEvent = {
    googleEventId: eventId,
    googleEventUrl: null,
    rawProviderPayload: event().payload,
  };

  await assert.rejects(
    setup.service.reconcileMeeting({ ...bookingDetails, pendingEvent }),
    (error: unknown) => {
      assert.ok(error instanceof MeetingBookingError);
      assert.equal(error.code, "unavailable");
      assert.equal(error.message.includes("Private"), false);

      return true;
    },
  );
  assert.equal(setup.records.size, 0);
  assert.deepEqual(setup.calls, []);
});

test("invalid operation IDs fail before any provider or database writes", async () => {
  const setup = harness();

  await assert.rejects(
    setup.service.bookMeeting({ ...input, bookingOperationId: "bad-id" }),
    MeetingBookingError,
  );
  assert.deepEqual(setup.calls, []);
  assert.equal(setup.records.size, 0);
});
