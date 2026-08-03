import assert from "node:assert/strict";
import test from "node:test";
import { findMeetingSlots } from "@/server/modules/assistant/tools/find-meeting-slots.tool";
import { MeetingWorkflowService } from "@/server/modules/assistant/workflow/meeting-workflow.service";

test("availability replaces a previous selected slot and invalidates confirmation", async () => {
  const workflow = new MeetingWorkflowService(() => "test-secret");

  const state = { ...workflow.reset(), selectedSlot: { start: "2026-09-14T11:00:00.000Z", end: "2026-09-14T11:30:00.000Z", timezone: "Europe/London" }, confirmed: true };

  const meetingService = { findAvailableSlots: async () => [{ start: "2026-09-15T11:00:00.000Z", end: "2026-09-15T11:30:00.000Z", timezone: "Europe/London" }], isSlotAvailable: async () => true, bookMeeting: async () => ({ googleEventId: "event", googleEventUrl: null }) };

  const result = await findMeetingSlots({ startDate: "2026-09-14", endDate: "2026-09-15", timezone: "Europe/London" }, { meetingService, workflow, state });

  assert.equal(result.state.selectedSlot, null);
  assert.equal(result.state.confirmed, false);
  assert.equal(result.state.availableSlots.length, 1);
});

test("workflow tokens reject tampered confirmation state", () => {
  const workflow = new MeetingWorkflowService(() => "test-secret");

  const token = workflow.encode({
    ...workflow.reset(),
    name: "Visitor",
    email: "visitor@example.com",
    timezone: "Europe/London",
    reason: "Discuss a project",
    availableSlots: [{ start: "2026-09-15T11:00:00.000Z", end: "2026-09-15T11:30:00.000Z", timezone: "Europe/London" }],
    selectedSlot: { start: "2026-09-15T11:00:00.000Z", end: "2026-09-15T11:30:00.000Z", timezone: "Europe/London" },
  });

  const [encoded, signature] = token.split(".");

  const payload = JSON.parse(Buffer.from(encoded!, "base64url").toString("utf8")) as { confirmed: boolean };

  payload.confirmed = true;
  const tampered = `${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${signature}`;

  assert.equal(workflow.decode(tampered).confirmed, false);
});
