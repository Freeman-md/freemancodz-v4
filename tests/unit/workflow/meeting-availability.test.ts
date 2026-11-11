import assert from "node:assert/strict";
import test from "node:test";
import { findMeetingSlots } from "@/modules/workflow/definitions/meeting-booking/tool-handlers";

const state = {
  reason: "Discuss a project",
  availableSlots: [
    {
      start: "2099-06-15T11:00:00.000Z",
      end: "2099-06-15T11:30:00.000Z",
      timezone: "Europe/London",
    },
  ],
  selectedSlot: null,
};

test("a date range with no available times clears the previous offers", async () => {
  const result = await findMeetingSlots(
    { findAvailableSlots: async () => [], isSlotAvailable: async () => false },
    state,
    { startDate: "2099-06-15", endDate: "2099-06-15" },
  );

  assert.deepEqual(result, {
    state: { ...state, availableSlots: [] },
    output: { status: "no_slots", slots: [] },
  });
});

test("an invalid date range does not call Calendar or change state", async (t) => {
  const findAvailableSlots = t.mock.fn(async () => []);

  const result = await findMeetingSlots(
    { findAvailableSlots, isSlotAvailable: async () => false },
    state,
    { startDate: "2099-06-15", endDate: "2099-06-29" },
  );

  assert.equal(result.output.status, "invalid_date_range");
  assert.equal(result.state, undefined);
  assert.equal(findAvailableSlots.mock.callCount(), 0);
});
