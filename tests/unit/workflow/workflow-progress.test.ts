import assert from "node:assert/strict";
import test from "node:test";

import { ContactWorkflowProgressProjector } from "@/modules/workflow/definitions/contact/contact.progress";
import { MeetingBookingWorkflowProgressProjector } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.progress";

const interactionId = "11111111-1111-4111-8111-111111111111";

const contactWorkflowProgress = new ContactWorkflowProgressProjector();

const meetingBookingWorkflowProgress = new MeetingBookingWorkflowProgressProjector();

test("contact progress exposes ordered public fields and accurate missing requirements", () => {
  const collecting = contactWorkflowProgress.getProgress(
    {
      name: "Jonathan",
      email: null,
      message: null,
      businessName: null,
      preparedInteractionId: null,
    },
    "active",
  );

  assert.deepEqual(collecting, {
    phase: "collecting",
    fields: [
      { key: "name", required: true, value: "Jonathan" },
      { key: "email", required: true, value: null },
      { key: "message", required: true, value: null },
      { key: "businessName", required: false, value: null },
    ],
    missingRequiredFields: ["email", "message"],
  });

  const prepared = contactWorkflowProgress.getProgress(
    {
      name: "Jonathan",
      email: "jonathan@example.com",
      message: "Audit",
      businessName: null,
      preparedInteractionId: interactionId,
    },
    "active",
  );

  assert.equal(prepared.phase, "awaiting_confirmation");
  assert.deepEqual(prepared.missingRequiredFields, []);
  assert.equal(JSON.stringify(prepared).includes("preparedInteractionId"), false);
});

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
