import assert from "node:assert/strict";
import test from "node:test";
import type { IGoogleCalendarProvider } from "@/server/infrastructure/google-calendar/interfaces/google-calendar.provider.interface";
import type { IMeetingRepository } from "@/server/modules/meeting/interfaces/meeting.repository.interface";
import { MeetingService } from "@/server/modules/meeting/services/meeting.service";
import { MeetingBookingWorkflowDefinition } from "@/server/modules/workflow/definitions/meeting-booking/meeting-booking.definition";

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

  const workflow = new MeetingBookingWorkflowDefinition(service);

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

test("elapsed slots are unavailable without querying Calendar", async () => {
  let queries = 0;

  const calendar: IGoogleCalendarProvider = {
    getBusyPeriods: async () => {
      queries += 1;

      return [];
    },
    createEvent: async () => ({ id: "event", htmlLink: null, payload: {} }),
  };

  const repository: IMeetingRepository = {
    createMeeting: async () => {
      throw new Error("not used");
    },
    findMeetingByGoogleEventId: async () => null,
    updateMeeting: async () => {
      throw new Error("not used");
    },
  };

  const service = new MeetingService(calendar, repository, {
    info: () => undefined,
    error: () => undefined,
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
});
