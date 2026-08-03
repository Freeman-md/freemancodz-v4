import assert from "node:assert/strict";
import test from "node:test";
import { findMeetingSlots } from "@/server/modules/assistant/tools/find-meeting-slots.tool";
import { findMeetingSlotsSchema } from "@/server/modules/assistant/schemas/tools/find-meeting-slots.schema";
import { prepareMeetingSchema } from "@/server/modules/assistant/schemas/tools/prepare-meeting.schema";
import { WorkflowService } from "@/server/modules/assistant/services/workflow.service";

test("availability replaces a previous selected slot and invalidates confirmation", async () => {
  const workflow = new WorkflowService(() => "test-secret");

  const state = {
    ...workflow.reset(),
    selectedSlot: {
      start: "2026-09-14T11:00:00.000Z",
      end: "2026-09-14T11:30:00.000Z",
      timezone: "Europe/London",
    },
    confirmed: true,
  };

  const meetingService = {
    findAvailableSlots: async () => [
      {
        start: "2026-09-15T11:00:00.000Z",
        end: "2026-09-15T11:30:00.000Z",
        timezone: "Europe/London",
      },
    ],
    isSlotAvailable: async () => true,
    bookMeeting: async () => ({ googleEventId: "event", googleEventUrl: null }),
    reconcileMeeting: async () => ({ googleEventId: "event", googleEventUrl: null }),
  };

  const result = await findMeetingSlots(
    { startDate: "2026-09-14", endDate: "2026-09-15" },
    { meetingService, workflow, state },
  );

  assert.equal(result.state.selectedSlot, null);
  assert.equal(result.state.confirmed, false);
  assert.equal(result.state.availableSlots.length, 1);
});

test("workflow tokens reject tampered confirmation state", () => {
  const workflow = new WorkflowService(() => "test-secret");

  const token = workflow.encode({
    ...workflow.reset(),
    name: "Visitor",
    email: "visitor@example.com",
    timezone: "Europe/London",
    reason: "Discuss a project",
    availableSlots: [
      {
        start: "2026-09-15T11:00:00.000Z",
        end: "2026-09-15T11:30:00.000Z",
        timezone: "Europe/London",
      },
    ],
    selectedSlot: {
      start: "2026-09-15T11:00:00.000Z",
      end: "2026-09-15T11:30:00.000Z",
      timezone: "Europe/London",
    },
  });

  const [iv, ciphertext, tag] = token.split(".");

  const tampered = `${iv}.${ciphertext!.slice(0, -1)}A.${tag}`;

  assert.equal(workflow.decode(tampered).confirmed, false);
});

test("meeting tool schemas reject model-supplied timezones", () => {
  assert.equal(
    findMeetingSlotsSchema.safeParse({
      startDate: "2026-09-14",
      endDate: "2026-09-15",
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
      selectedSlot: {
        start: "2026-09-15T11:00:00.000Z",
        end: "2026-09-15T11:30:00.000Z",
      },
    }).success,
    false,
  );
});
