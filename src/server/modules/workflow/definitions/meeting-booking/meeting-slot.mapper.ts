import { MEETING_CONFIG, type MeetingSlot } from "@/server/modules/meeting/public";

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: MEETING_CONFIG.timezone,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatMeetingSlot(slot: MeetingSlot) {
  return `${formatter.format(new Date(slot.start))} ${MEETING_CONFIG.timezone}`;
}
