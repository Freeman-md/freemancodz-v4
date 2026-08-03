import type { FindMeetingSlotsInput } from "../schemas/tools/find-meeting-slots.schema";

export function findMeetingSlots(input: FindMeetingSlotsInput) {
  const dates = parseDateRange(input.dateRange);

  if (!dates) {
    return {
      kind: "dummy_meeting_slots",
      status: "unavailable",
      reason: "date_range_unparseable",
      message: "Provide a date range in YYYY-MM-DD to YYYY-MM-DD format to find dummy slots.",
      slots: [],
    };
  }

  const [startDate, endDate] = dates;

  return {
    kind: "dummy_meeting_slots",
    status: "available",
    dateRange: input.dateRange,
    durationMinutes: input.durationMinutes,
    timezone: input.timezone,
    slots: createSlots(startDate, endDate, input.timezone),
  };
}

function parseDateRange(dateRange: string): [Date, Date] | null {
  const values = dateRange.match(/\d{4}-\d{2}-\d{2}/g);

  if (!values || values.length !== 2) {
    return null;
  }

  const startDate = parseDate(values[0]);

  const endDate = parseDate(values[1]);

  return startDate && endDate && startDate <= endDate ? [startDate, endDate] : null;
}

function parseDate(value: string): Date | null {
  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function createSlots(startDate: Date, endDate: Date, timezone: string) {
  const first = startDate.toISOString().slice(0, 10);

  const secondDate = new Date(startDate);

  secondDate.setUTCDate(secondDate.getUTCDate() + 1);

  const slots = [{ id: `dummy-slot-${first}`, startsAt: `${first}T10:00:00`, timezone }];

  if (secondDate <= endDate) {
    const second = secondDate.toISOString().slice(0, 10);

    slots.push({ id: `dummy-slot-${second}`, startsAt: `${second}T14:00:00`, timezone });
  }

  return slots;
}
