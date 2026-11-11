import assert from "node:assert/strict";
import test from "node:test";

import { MeetingBookingWorkflowDefinition } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.definition";
import { MeetingBookingWorkflowProgressProjector } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.progress";
import {
  findMeetingSlotsSchema,
  prepareMeetingSchema,
} from "@/modules/workflow/definitions/meeting-booking/meeting-booking.schema";
import { MeetingBookingError, type MeetingServiceClient } from "@/modules/meeting/types";
import type { CalendarClient, CreatedCalendarEvent } from "@/infrastructure/google-calendar/types";
import type { MeetingStore } from "@/modules/meeting/types";
import { MeetingService } from "@/modules/meeting/service";
import { CalendarAvailabilityError } from "@/infrastructure/google-calendar/types";

const slot = {
  start: "2099-09-15T11:00:00.000Z",
  end: "2099-09-15T11:30:00.000Z",
  timezone: "Europe/London",
};

const meetingBookingWorkflowProgress = new MeetingBookingWorkflowProgressProjector();

const startContext = {
  originChannel: "test",
  originPage: null,
  originEntry: null,
};

const PREPARATION_INTERACTION = {
  workflowInstanceId: "11111111-1111-4111-8111-111111111111",
  interactionId: "33333333-3333-4333-8333-333333333333",
};

const CONFIRMATION_INTERACTION = {
  workflowInstanceId: "11111111-1111-4111-8111-111111111111",
  interactionId: "44444444-4444-4444-8444-444444444444",
  allowConfirmation: true,
  expectedRevision: 2,
};

function createMeetingService(overrides: Partial<MeetingServiceClient> = {}): MeetingServiceClient {
  return {
    findAvailableSlots: async () => [slot],
    isSlotAvailable: async () => true,
    bookMeeting: async () => ({ googleEventId: "event_test", googleEventUrl: null }),
    reconcileMeeting: async () => ({ googleEventId: "event_test", googleEventUrl: null }),
    ...overrides,
  };
}

async function prepareDefinition(definition: MeetingBookingWorkflowDefinition) {
  const initial = definition.createInitialState(startContext);

  const availability = await definition.executeTool(
    "find_meeting_slots",
    JSON.stringify({ startDate: "2099-09-15", endDate: "2099-09-15" }),
    initial,
    PREPARATION_INTERACTION,
  );

  return definition.executeTool(
    "prepare_meeting",
    JSON.stringify({
      name: "Visitor",
      email: "visitor@example.com",
      reason: "Discuss a project",
      selectedSlot: { start: slot.start, end: slot.end },
    }),
    availability.state,
    PREPARATION_INTERACTION,
  );
}

test("incremental meeting updates are atomic, preserve known details and invalidate only changed preparations", async () => {
  const definition = new MeetingBookingWorkflowDefinition(
    createMeetingService(),
    meetingBookingWorkflowProgress,
  );

  const update = (state: ReturnType<typeof definition.createInitialState>, updates: unknown[]) =>
    definition.executeTool(
      "update_meeting_context",
      JSON.stringify({ updates }),
      state,
      PREPARATION_INTERACTION,
    );

  const named = await update(definition.createInitialState(startContext), [
    { field: "name", value: " Visitor " },
  ]);

  assert.equal(named.state.name, "Visitor");
  assert.equal(named.state.email, null);
  const invalid = await update(named.state, [
    { field: "reason", value: "Discuss work" },
    { field: "email", value: "invalid" },
  ]);

  assert.deepEqual(invalid.state, named.state);
  const duplicate = await update(named.state, [
    { field: "name", value: "One" },
    { field: "name", value: "Two" },
  ]);

  assert.deepEqual(duplicate.state, named.state);
  const prepared = await prepareDefinition(definition);

  const unchanged = await update(prepared.state, [{ field: "name", value: "Visitor" }]);

  assert.equal(unchanged.state.preparedInteractionId, prepared.state.preparedInteractionId);
  const corrected = await update(prepared.state, [{ field: "reason", value: "New topic" }]);

  assert.equal(corrected.state.step, "collecting");
  assert.equal(corrected.state.preparedInteractionId, null);
  assert.equal(corrected.state.email, prepared.state.email);
  assert.deepEqual(corrected.state.selectedSlot, prepared.state.selectedSlot);
  const missingSlot = await update(named.state, [
    { field: "selectedSlot", value: { start: slot.start, end: slot.end } },
  ]);

  assert.deepEqual(missingSlot.state, named.state);
  const refreshed = await definition.executeTool(
    "find_meeting_slots",
    '{"startDate":"2099-09-15","endDate":"2099-09-15"}',
    corrected.state,
    PREPARATION_INTERACTION,
  );

  assert.equal(refreshed.state.name, "Visitor");
  assert.equal(refreshed.state.reason, "New topic");
  assert.equal(refreshed.state.selectedSlot, null);
  const frozen = {
    ...prepared.state,
    step: "confirmed" as const,
    bookingOperation: { id: "11111111-1111-4111-8111-111111111111", preparedRevision: 1 },
  };

  assert.deepEqual((await update(frozen, [{ field: "name", value: "Other" }])).state, frozen);
});

test("preparation requires a later explicit confirmation transition before booking", async () => {
  let bookingCalls = 0;

  const definition = new MeetingBookingWorkflowDefinition(
    createMeetingService({
      bookMeeting: async () => {
        bookingCalls += 1;

        return { googleEventId: "event_test", googleEventUrl: null };
      },
    }),
    meetingBookingWorkflowProgress,
  );

  const prepared = await prepareDefinition(definition);

  const preparedTools = definition.getTools(prepared.state).map(({ name }) => name);

  assert.deepEqual(preparedTools, [
    "find_meeting_slots",
    "prepare_meeting",
    "update_meeting_context",
  ]);
  assert.equal(preparedTools.includes("book_meeting"), false);

  const earlyBooking = await definition.executeTool("book_meeting", "{}", prepared.state, {
    ...PREPARATION_INTERACTION,
    allowConfirmation: true,
    expectedRevision: 2,
  });

  assert.equal(earlyBooking.output.error, "confirmation_required");
  assert.equal(bookingCalls, 0);

  const sameInteractionConfirmation = await definition.executeTool(
    "confirm_meeting",
    "{}",
    prepared.state,
    { ...PREPARATION_INTERACTION, allowConfirmation: true, expectedRevision: 2 },
  );

  assert.equal(sameInteractionConfirmation.output.error, "confirmation_requires_new_input");
  assert.equal(sameInteractionConfirmation.state.step, "awaiting_confirmation");

  const unconfirmedRequest = await definition.executeTool("confirm_meeting", "{}", prepared.state, {
    ...CONFIRMATION_INTERACTION,
    allowConfirmation: false,
  });

  assert.equal(unconfirmedRequest.output.error, "separate_confirmation_required");
  assert.equal(unconfirmedRequest.state.step, "awaiting_confirmation");
  assert.equal(bookingCalls, 0);

  const confirmed = await definition.executeTool(
    "confirm_meeting",
    "{}",
    prepared.state,
    CONFIRMATION_INTERACTION,
  );

  assert.deepEqual(
    definition.getTools(confirmed.state).map(({ name }) => name),
    [],
  );

  const booked = await definition.executeTool(
    "book_meeting",
    "{}",
    confirmed.state,
    CONFIRMATION_INTERACTION,
  );

  assert.equal(booked.status, "completed");
  assert.equal(booked.output.status, "confirmed");
  assert.equal(bookingCalls, 1);
});

test("a persistence retry reconciles one created event without exposing provider data", async () => {
  let createEventCalls = 0;

  let persistenceAttempts = 0;

  let calendarTimezone: string | undefined;

  let persistedTimezone: string | undefined;

  let persistedEventUrl: string | null | undefined;

  let notificationCalls = 0;

  let createdEvent: CreatedCalendarEvent | null = null;

  const calendar: CalendarClient = {
    getBusyPeriods: async () => [],
    findEvent: async () => createdEvent,
    createEvent: async (input) => {
      createEventCalls += 1;
      calendarTimezone = input.timezone;

      createdEvent = {
        id: input.eventId,
        htmlLink: `https://calendar.example/${input.eventId}`,
        payload: {
          id: input.eventId,
          status: "confirmed",
          summary: input.summary,
          description: input.description,
          attendees: [{ email: input.attendeeEmail }],
          start: { dateTime: input.start.toISOString(), timeZone: input.timezone },
          end: { dateTime: input.end.toISOString(), timeZone: input.timezone },
          extendedProperties: { private: { bookingOperationId: input.bookingOperationId } },
        },
      };

      return createdEvent;
    },
  };

  const repository: MeetingStore = {
    createMeeting: async (input) => {
      persistenceAttempts += 1;
      persistedTimezone = input.timezone;
      persistedEventUrl = input.googleEventUrl;

      if (persistenceAttempts === 1) {
        throw new Error("database unavailable");
      }

      return {
        ...input,
        id: "meeting_1",
        createdAt: new Date(),
        updatedAt: new Date(),
        rawProviderPayload: JSON.parse(
          JSON.stringify(input.rawProviderPayload),
        ) as import("@/generated/prisma/client").Prisma.JsonValue,
      };
    },
    findMeetingByGoogleEventId: async () => null,
    updateMeeting: async (input) => ({
      ...input,
      id: "meeting_1",
      createdAt: new Date(),
      updatedAt: new Date(),
      rawProviderPayload: JSON.parse(
        JSON.stringify(input.rawProviderPayload),
      ) as import("@/generated/prisma/client").Prisma.JsonValue,
    }),
  };

  const meetingService = new MeetingService(
    calendar,
    repository,
    {
      info: () => undefined,
      error: () => undefined,
    },
    {
      notifyMeetingBooked: async (record) => {
        notificationCalls += 1;
        assert.equal(persistenceAttempts, 2);
        assert.equal(record.id, "meeting_1");
      },
    },
  );

  const definition = new MeetingBookingWorkflowDefinition(
    meetingService,
    meetingBookingWorkflowProgress,
  );

  const prepared = await prepareDefinition(definition);

  const confirmed = await definition.executeTool(
    "confirm_meeting",
    "{}",
    prepared.state,
    CONFIRMATION_INTERACTION,
  );

  const first = await definition.executeTool(
    "book_meeting",
    "{}",
    confirmed.state,
    CONFIRMATION_INTERACTION,
  );

  assert.equal(first.status, "active");
  assert.equal(first.output.error, "booking_recovery_required");
  const eventId = `b${confirmed.state.bookingOperation!.id.replaceAll("-", "")}`;

  assert.equal(first.state.pendingBooking, null);
  assert.deepEqual(first.state.bookingOperation, confirmed.state.bookingOperation);

  const second = await definition.executeTool(
    "book_meeting",
    "{}",
    first.state,
    CONFIRMATION_INTERACTION,
  );

  assert.equal(second.status, "completed");
  assert.equal(createEventCalls, 1);
  assert.equal(persistenceAttempts, 2);
  assert.equal(notificationCalls, 1);
  assert.equal(calendarTimezone, "Europe/London");
  assert.equal(persistedTimezone, "Europe/London");
  assert.equal(persistedEventUrl, `https://calendar.example/${eventId}`);
  assert.deepEqual(second.output, {
    kind: "meeting_booking",
    status: "confirmed",
    attendeeEmail: "visitor@example.com",
    start: slot.start,
    end: slot.end,
    timezone: "Europe/London",
    message:
      "Your meeting is booked for Tuesday, 15 September 2099 at 12:00 pm Europe/London. A calendar invitation will be sent to visitor@example.com.",
  });
  assert.equal("googleEventId" in second.output, false);
  assert.equal("googleEventUrl" in second.output, false);
  assert.equal("rawProviderPayload" in second.output, false);
});

test("an unavailable slot is rejected before accepting confirmation", async () => {
  const definition = new MeetingBookingWorkflowDefinition(
    createMeetingService({ isSlotAvailable: async () => false }),
    meetingBookingWorkflowProgress,
  );

  const prepared = await prepareDefinition(definition);

  const confirmed = await definition.executeTool(
    "confirm_meeting",
    "{}",
    prepared.state,
    CONFIRMATION_INTERACTION,
  );

  const result = confirmed;

  assert.equal(result.status, "active");
  assert.equal(result.output.error, "slot_unavailable");
  assert.equal(result.state.selectedSlot, null);
  assert.equal(result.state.bookingOperation, null);
  assert.deepEqual(result.state.availableSlots, []);
  assert.deepEqual(
    definition.getTools(result.state).map(({ name }) => name),
    ["find_meeting_slots", "update_meeting_context"],
  );
});

test("meeting schemas reject model-supplied timezones", () => {
  assert.equal(
    findMeetingSlotsSchema.safeParse({
      startDate: "2099-09-14",
      endDate: "2099-09-15",
      timezone: "America/New_York",
    }).success,
    false,
  );
  assert.equal(
    prepareMeetingSchema.safeParse({
      name: "Visitor",
      email: "visitor@example.com",
      reason: "Discuss a project",
      timezone: "America/New_York",
      selectedSlot: { start: slot.start, end: slot.end },
    }).success,
    false,
  );
});

test("availability failure does not accept confirmation or discard the saved summary", async () => {
  let bookingCalls = 0;

  const definition = new MeetingBookingWorkflowDefinition(
    createMeetingService({
      isSlotAvailable: async () => {
        throw new CalendarAvailabilityError();
      },
      bookMeeting: async () => {
        bookingCalls += 1;

        return { googleEventId: "unexpected", googleEventUrl: null };
      },
    }),
    meetingBookingWorkflowProgress,
  );

  const prepared = await prepareDefinition(definition);

  const result = await definition.executeTool(
    "confirm_meeting",
    "{}",
    prepared.state,
    CONFIRMATION_INTERACTION,
  );

  assert.equal(result.output.error, "meeting_availability_unavailable");
  assert.deepEqual(result.state, prepared.state);
  assert.equal(result.state.bookingOperation, null);
  assert.equal(bookingCalls, 0);
});

test("accepted operations keep their identity and details after all safe provider failures", async () => {
  for (const code of [
    "unavailable",
    "uncertain",
    "conflict",
    "slot_unavailable",
    "invalid_operation",
  ] as const) {
    const operationIds: string[] = [];

    const definition = new MeetingBookingWorkflowDefinition(
      createMeetingService({
        bookMeeting: async ({ bookingOperationId }) => {
          operationIds.push(bookingOperationId);
          throw new MeetingBookingError(code);
        },
      }),
      meetingBookingWorkflowProgress,
    );

    const prepared = await prepareDefinition(definition);

    const confirmed = await definition.executeTool(
      "confirm_meeting",
      "{}",
      prepared.state,
      CONFIRMATION_INTERACTION,
    );

    const first = await definition.executeTool(
      "book_meeting",
      "{}",
      confirmed.state,
      CONFIRMATION_INTERACTION,
    );

    const second = await definition.executeTool(
      "book_meeting",
      "{}",
      first.state,
      CONFIRMATION_INTERACTION,
    );

    assert.equal(first.output.error, "booking_recovery_required");
    assert.deepEqual(first.state, confirmed.state);
    assert.deepEqual(second.state, confirmed.state);
    assert.deepEqual(operationIds, [
      confirmed.state.bookingOperation!.id,
      confirmed.state.bookingOperation!.id,
    ]);
    assert.deepEqual(definition.getTools(second.state), []);
  }
});

test("legacy confirmed state without a known operation never creates a new event", async () => {
  let bookingCalls = 0;

  const definition = new MeetingBookingWorkflowDefinition(
    createMeetingService({
      bookMeeting: async () => {
        bookingCalls += 1;

        return { googleEventId: "unexpected", googleEventUrl: null };
      },
    }),
    meetingBookingWorkflowProgress,
  );

  const prepared = await prepareDefinition(definition);

  const legacy = { ...prepared.state, step: "confirmed" as const, bookingOperation: null };

  const result = await definition.executeTool(
    "book_meeting",
    "{}",
    legacy,
    CONFIRMATION_INTERACTION,
  );

  assert.equal(result.output.error, "booking_recovery_blocked");
  assert.equal(bookingCalls, 0);
});

test("pending recovery refuses details or event identity that differ from the confirmed summary", async () => {
  let reconciliationCalls = 0;

  const definition = new MeetingBookingWorkflowDefinition(
    createMeetingService({
      reconcileMeeting: async () => {
        reconciliationCalls += 1;

        return { googleEventId: "legacy-event", googleEventUrl: null };
      },
    }),
    meetingBookingWorkflowProgress,
  );

  const prepared = await prepareDefinition(definition);

  const legacy = {
    ...prepared.state,
    step: "confirmed" as const,
    bookingOperation: null,
    pendingBooking: {
      googleEventId: "legacy-event",
      googleEventUrl: null,
      rawProviderPayload: {},
      name: prepared.state.name!,
      email: prepared.state.email!,
      reason: prepared.state.reason!,
      selectedSlot: slot,
    },
  };

  for (const pendingBooking of [
    { ...legacy.pendingBooking, name: "Different visitor" },
    { ...legacy.pendingBooking, email: "different@example.com" },
    { ...legacy.pendingBooking, reason: "Different topic" },
    { ...legacy.pendingBooking, selectedSlot: { ...slot, start: "2099-09-15T12:00:00.000Z" } },
    { ...legacy.pendingBooking, selectedSlot: { ...slot, end: "2099-09-15T12:30:00.000Z" } },
    { ...legacy.pendingBooking, selectedSlot: { ...slot, timezone: "UTC" } },
  ]) {
    const result = await definition.executeTool(
      "book_meeting",
      "{}",
      { ...legacy, pendingBooking },
      CONFIRMATION_INTERACTION,
    );

    assert.equal(result.status, "active");
    assert.equal(result.output.error, "booking_recovery_blocked");
    assert.deepEqual(result.state.pendingBooking, pendingBooking);
  }

  const wrongOperation = await definition.executeTool(
    "book_meeting",
    "{}",
    {
      ...legacy,
      bookingOperation: { id: "55555555-5555-4555-8555-555555555555", preparedRevision: 2 },
    },
    CONFIRMATION_INTERACTION,
  );

  assert.equal(wrongOperation.output.error, "booking_recovery_blocked");
  assert.equal(wrongOperation.status, "active");
  assert.equal(reconciliationCalls, 0);

  const normalizedEmail = await definition.executeTool(
    "book_meeting",
    "{}",
    {
      ...legacy,
      pendingBooking: { ...legacy.pendingBooking, email: " VISITOR@EXAMPLE.COM " },
    },
    CONFIRMATION_INTERACTION,
  );

  assert.equal(normalizedEmail.status, "completed");
  assert.equal(reconciliationCalls, 1);
});
