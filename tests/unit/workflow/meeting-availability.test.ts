import assert from "node:assert/strict";
import test from "node:test";
import { CalendarAvailabilityError } from "@/infrastructure/google-calendar/types";
import { resolveMeetingTime } from "@/modules/meeting/time";
import { findMeetingSlots } from "@/modules/workflow/definitions/meeting-booking/tool-handlers";

const state = {
  name: null,
  email: null,
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

test("the seven-day window starts on today's London date, including across UTC midnight", async (t) => {
  const findAvailableSlots = t.mock.fn(async () => []);

  await findMeetingSlots(
    { findAvailableSlots, isSlotAvailable: async () => false },
    state,
    { startDate: null, endDate: null },
    new Date("2026-06-30T23:30:00Z"),
  );

  assert.deepEqual(findAvailableSlots.mock.calls[0].arguments, [
    { startDate: "2026-07-01", endDate: "2026-07-07" },
  ]);
});

test("a preferred time uses the visitor's timezone and matches the exact London slot", async (t) => {
  const findAvailableSlots = t.mock.fn(async () => state.availableSlots);

  const result = await findMeetingSlots(
    { findAvailableSlots, isSlotAvailable: async () => true },
    state,
    {
      startDate: null,
      endDate: null,
      preferredTime: {
        date: "2099-06-15",
        time: "16:30",
        timeZone: "+05:30",
      },
    },
    new Date("2026-11-11T12:00:00Z"),
  );

  assert.deepEqual(findAvailableSlots.mock.calls[0].arguments, [
    { startDate: "2099-06-15", endDate: "2099-06-15" },
  ]);
  assert.equal(result.output.requestedTimeAvailable, true);
  assert.deepEqual(result.state?.availableSlots, state.availableSlots);
});

test("London noon follows daylight saving and ambiguous or invalid wall times are rejected", () => {
  assert.equal(
    resolveMeetingTime("2026-11-13", "12:00", "Europe/London")?.toISOString(),
    "2026-11-13T12:00:00.000Z",
  );
  assert.equal(
    resolveMeetingTime("2026-07-13", "12:00", "Europe/London")?.toISOString(),
    "2026-07-13T11:00:00.000Z",
  );
  assert.equal(resolveMeetingTime("2026-10-25", "01:30", "Europe/London"), null);
  assert.equal(resolveMeetingTime("2026-03-29", "01:30", "Europe/London"), null);
  assert.equal(resolveMeetingTime("2026-11-13", "12:00", "Unknown/Zone"), null);
});

test("a Calendar outage has a distinct result and preserves draft state", async () => {
  const result = await findMeetingSlots(
    {
      findAvailableSlots: async () => {
        throw new CalendarAvailabilityError();
      },
      isSlotAvailable: async () => false,
    },
    state,
    { startDate: "2099-06-15", endDate: "2099-06-15" },
  );

  assert.equal(result.output.status, "availability_unavailable");
  assert.equal(result.state, undefined);
});
