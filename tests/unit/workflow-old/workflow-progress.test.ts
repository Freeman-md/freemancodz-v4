import assert from "node:assert/strict";
import test from "node:test";

import { MeetingBookingWorkflowProgressProjector } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.progress";

const interactionId = "11111111-1111-4111-8111-111111111111";

const meetingBookingWorkflowProgress = new MeetingBookingWorkflowProgressProjector();

test("meeting progress exposes the selected slot without provider recovery state", () => {
  const selectedSlot = {
    start: "2099-09-15T11:00:00.000Z",
    end: "2099-09-15T11:30:00.000Z",
    timezone: "Europe/London",
  };

  const progress = meetingBookingWorkflowProgress.getProgress(
    {
      step: "confirmed",
      name: "Visitor",
      email: "visitor@example.com",
      reason: "Discuss a project",
      availableSlots: [selectedSlot],
      availabilityCheckedAt: "2099-09-01T10:00:00.000Z",
      selectedSlot,
      preparedInteractionId: interactionId,
      pendingBooking: {
        googleEventId: "private-event-id",
        googleEventUrl: "https://calendar.example/private",
        rawProviderPayload: { private: "provider-data" },
        name: "Visitor",
        email: "visitor@example.com",
        reason: "Discuss a project",
        selectedSlot,
      },
    },
    "active",
  );

  assert.deepEqual(progress, {
    phase: "processing",
    fields: [
      { key: "name", required: true, value: "Visitor" },
      { key: "email", required: true, value: "visitor@example.com" },
      { key: "reason", required: true, value: "Discuss a project" },
      { key: "selectedSlot", required: true, value: selectedSlot },
    ],
    missingRequiredFields: [],
  });

  const serialized = JSON.stringify(progress);

  assert.doesNotMatch(
    serialized,
    /availableSlots|availabilityCheckedAt|preparedInteractionId|pendingBooking|googleEvent|provider-data/,
  );
});
