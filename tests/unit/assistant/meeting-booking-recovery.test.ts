import assert from "node:assert/strict";
import test from "node:test";
import { bookMeeting } from "@/server/modules/assistant/tools/book-meeting.tool";
import { MeetingWorkflowService } from "@/server/modules/assistant/workflow/meeting-workflow.service";
import type { IGoogleCalendarProvider } from "@/server/infrastructure/google-calendar/interfaces/google-calendar.provider.interface";
import type { IMeetingRepository } from "@/server/modules/meeting/interfaces/meeting.repository.interface";
import { MeetingService } from "@/server/modules/meeting/services/meeting.service";

test("a persistence retry reconciles one created calendar event without creating another", async () => {
  let createEventCalls = 0;

  let persistenceAttempts = 0;

  const calendar: IGoogleCalendarProvider = {
    getBusyPeriods: async () => [],
    createEvent: async () => {
      createEventCalls += 1;

      return { id: "event_1", htmlLink: "https://calendar.example/event_1", payload: { id: "event_1" } };
    },
  };

  const repository: IMeetingRepository = {
    createMeeting: async (input) => {
      persistenceAttempts += 1;
      if (persistenceAttempts === 1) {throw new Error("database unavailable");}

      return { ...input, id: "meeting_1", createdAt: new Date(), updatedAt: new Date(), rawProviderPayload: JSON.parse(JSON.stringify(input.rawProviderPayload)) as import("@/generated/prisma/client").Prisma.JsonValue };
    },
    findMeetingByGoogleEventId: async () => null,
    updateMeeting: async (input) => ({ ...input, id: "meeting_1", createdAt: new Date(), updatedAt: new Date(), rawProviderPayload: JSON.parse(JSON.stringify(input.rawProviderPayload)) as import("@/generated/prisma/client").Prisma.JsonValue }),
  };

  const workflow = new MeetingWorkflowService(() => "test-secret");

  const slot = { start: "2026-09-15T11:00:00.000Z", end: "2026-09-15T11:30:00.000Z", timezone: "Europe/London" };

  const state = { ...workflow.reset(), name: "Visitor", email: "visitor@example.com", timezone: "Europe/London", reason: "Discuss a project", availableSlots: [slot], selectedSlot: slot, confirmed: true };

  const service = new MeetingService(calendar, repository, { info: () => undefined, error: () => undefined });

  const first = await bookMeeting({}, { workflow, meetingService: service, state });

  assert.equal(first.output.error, "booking_recovery_required");
  assert.equal(first.state.pendingBooking?.googleEventId, "event_1");

  const second = await bookMeeting({}, { workflow, meetingService: service, state: first.state });

  assert.equal("status" in second.output && second.output.status, "confirmed");
  assert.equal(second.state.pendingBooking, null);
  assert.equal(createEventCalls, 1);
  assert.equal(persistenceAttempts, 2);
});
