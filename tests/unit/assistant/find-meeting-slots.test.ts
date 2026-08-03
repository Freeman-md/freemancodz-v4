import assert from "node:assert/strict";
import test from "node:test";

import { findMeetingSlots } from "@/server/modules/assistant/tools/find-meeting-slots.tool";

test("dummy meeting slots remain within an explicit requested range", () => {
  const result = findMeetingSlots({
    dateRange: "2026-09-14 to 2026-09-15",
    durationMinutes: 30,
    timezone: "Europe/London",
  });

  assert.deepEqual(result.slots, [
    {
      id: "dummy-slot-2026-09-14",
      startsAt: "2026-09-14T10:00:00",
      timezone: "Europe/London",
    },
    {
      id: "dummy-slot-2026-09-15",
      startsAt: "2026-09-15T14:00:00",
      timezone: "Europe/London",
    },
  ]);
});

test("dummy meeting slots return a controlled result for an unparseable range", () => {
  const result = findMeetingSlots({
    dateRange: "next week",
    durationMinutes: 30,
    timezone: "Europe/London",
  });

  assert.equal(result.status, "unavailable");
  assert.deepEqual(result.slots, []);
});
