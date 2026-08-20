import assert from "node:assert/strict";
import test from "node:test";
import { formatMeetingSlot } from "@/server/modules/workflow/definitions/meeting-booking/meeting-slot.mapper";

test("meeting slot labels use Europe/London daylight-saving time", () => {
  assert.match(
    formatMeetingSlot({
      start: "2026-09-14T11:00:00.000Z",
      end: "2026-09-14T11:30:00.000Z",
      timezone: "Europe/London",
    }),
    /12:00 pm Europe\/London/i,
  );
});
