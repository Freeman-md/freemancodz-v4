import type { FindMeetingSlotsInput } from "../schemas/tools/find-meeting-slots.schema";

export function findMeetingSlots(input: FindMeetingSlotsInput) {
  return {
    kind: "dummy_meeting_slots",
    dateRange: input.dateRange,
    durationMinutes: input.durationMinutes,
    timezone: input.timezone,
    slots: [
      { id: "dummy-slot-1", startsAt: "2026-08-10T10:00:00", timezone: input.timezone },
      { id: "dummy-slot-2", startsAt: "2026-08-11T14:00:00", timezone: input.timezone },
    ],
  };
}
