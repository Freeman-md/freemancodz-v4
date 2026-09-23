import assert from "node:assert/strict";
import test from "node:test";

import { MeetingBookingWorkflowDefinition } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.definition";
import {
  findMeetingSlotsSchema,
  prepareMeetingSchema,
} from "@/modules/workflow/definitions/meeting-booking/meeting-booking.schema";
import type { MeetingServiceClient } from "@/modules/meeting/types";
import type { CalendarClient } from "@/infrastructure/google-calendar/types";
import type { MeetingStore } from "@/modules/meeting/types";
import { MeetingService } from "@/modules/meeting/service";

const slot = {
  start: "2099-09-15T11:00:00.000Z",
  end: "2099-09-15T11:30:00.000Z",
  timezone: "Europe/London",
};

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

test("preparation requires a later explicit confirmation transition before booking", async () => {
  let bookingCalls = 0;

  const definition = new MeetingBookingWorkflowDefinition(
    createMeetingService({
      bookMeeting: async () => {
        bookingCalls += 1;

        return { googleEventId: "event_test", googleEventUrl: null };
      },
    }),
  );

  const prepared = await prepareDefinition(definition);

  const preparedTools = definition.getTools(prepared.state).map(({ name }) => name);

  assert.deepEqual(preparedTools, ["find_meeting_slots", "prepare_meeting", "confirm_meeting"]);
  assert.equal(preparedTools.includes("book_meeting"), false);

  const earlyBooking = await definition.executeTool(
    "book_meeting",
    "{}",
    prepared.state,
    PREPARATION_INTERACTION,
  );

  assert.equal(earlyBooking.output.error, "confirmation_required");
  assert.equal(bookingCalls, 0);

  const sameInteractionConfirmation = await definition.executeTool(
    "confirm_meeting",
    "{}",
    prepared.state,
    PREPARATION_INTERACTION,
  );

  assert.equal(sameInteractionConfirmation.output.error, "confirmation_requires_new_input");
  assert.equal(sameInteractionConfirmation.state.step, "awaiting_confirmation");

  const confirmed = await definition.executeTool(
    "confirm_meeting",
    "{}",
    prepared.state,
    CONFIRMATION_INTERACTION,
  );

  assert.deepEqual(
    definition.getTools(confirmed.state).map(({ name }) => name),
    ["book_meeting"],
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

  const calendar: CalendarClient = {
    getBusyPeriods: async () => [],
    createEvent: async (input) => {
      createEventCalls += 1;
      calendarTimezone = input.timezone;

      return {
        id: "event_internal",
        htmlLink: "https://calendar.example/event_internal",
        payload: { id: "event_internal" },
      };
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

  const definition = new MeetingBookingWorkflowDefinition(meetingService);

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
  assert.equal(first.state.pendingBooking?.googleEventId, "event_internal");

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
  assert.equal(persistedEventUrl, "https://calendar.example/event_internal");
  assert.deepEqual(second.output, {
    kind: "meeting_booking",
    status: "confirmed",
    attendeeEmail: "visitor@example.com",
    start: slot.start,
    end: slot.end,
    timezone: "Europe/London",
  });
  assert.equal("googleEventId" in second.output, false);
  assert.equal("googleEventUrl" in second.output, false);
  assert.equal("rawProviderPayload" in second.output, false);
});

test("an unavailable confirmed slot forces a fresh availability check", async () => {
  const definition = new MeetingBookingWorkflowDefinition(
    createMeetingService({ isSlotAvailable: async () => false }),
  );

  const prepared = await prepareDefinition(definition);

  const confirmed = await definition.executeTool(
    "confirm_meeting",
    "{}",
    prepared.state,
    CONFIRMATION_INTERACTION,
  );

  const result = await definition.executeTool(
    "book_meeting",
    "{}",
    confirmed.state,
    CONFIRMATION_INTERACTION,
  );

  assert.equal(result.status, "active");
  assert.equal(result.output.error, "slot_unavailable");
  assert.equal(result.state.selectedSlot, null);
  assert.deepEqual(result.state.availableSlots, []);
  assert.deepEqual(
    definition.getTools(result.state).map(({ name }) => name),
    ["find_meeting_slots"],
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
