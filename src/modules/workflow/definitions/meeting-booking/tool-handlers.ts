import { CalendarAvailabilityError } from "@/infrastructure/google-calendar/types";
import { MEETING_CONFIG } from "@/modules/meeting/config";
import type { MeetingServiceClient, MeetingSlot } from "@/modules/meeting/types";
import type { WorkflowToolResult } from "../../types";
import {
  findSlotsArgumentsSchema,
  meetingStateSchema,
  selectSlotArgumentsSchema,
  topicArgumentsSchema,
} from "./schema";

export type MeetingAvailability = Pick<
  MeetingServiceClient,
  "findAvailableSlots" | "isSlotAvailable"
>;

const londonDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: MEETING_CONFIG.timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const slotLabel = new Intl.DateTimeFormat("en-GB", {
  timeZone: MEETING_CONFIG.timezone,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatMeetingSlot(slot: MeetingSlot) {
  return `${slotLabel.format(new Date(slot.start))} London time`;
}

export function saveMeetingTopic(savedState: unknown, args: unknown): WorkflowToolResult {
  const state = meetingStateSchema.parse(savedState);

  const { reason } = topicArgumentsSchema.parse(args);

  return { state: { ...state, reason }, output: { status: "saved" } };
}

export async function findMeetingSlots(
  availability: MeetingAvailability,
  savedState: unknown,
  args: unknown,
): Promise<WorkflowToolResult> {
  const state = meetingStateSchema.parse(savedState);

  const range = findSlotsArgumentsSchema.parse(args);

  const daysBetween = (Date.parse(range.endDate) - Date.parse(range.startDate)) / 86_400_000;

  if (
    range.startDate < londonDate.format(new Date()) ||
    daysBetween < 0 ||
    daysBetween >= MEETING_CONFIG.maximumRangeDays
  ) {
    return {
      output: {
        status: "invalid_date_range",
        message: "Choose an upcoming date range of up to 14 days.",
      },
    };
  }

  try {
    const slots = (await availability.findAvailableSlots(range)).slice(0, 4);

    return {
      state: { ...state, availableSlots: slots },
      output: {
        status: slots.length > 0 ? "available" : "no_slots",
        slots: slots.map((slot) => ({ start: slot.start, label: formatMeetingSlot(slot) })),
      },
    };
  } catch (error) {
    if (!(error instanceof CalendarAvailabilityError)) {
      throw error;
    }

    return { output: { status: "availability_unavailable" } };
  }
}

export async function selectMeetingSlot(
  availability: MeetingAvailability,
  savedState: unknown,
  args: unknown,
): Promise<WorkflowToolResult> {
  const state = meetingStateSchema.parse(savedState);

  const { start } = selectSlotArgumentsSchema.parse(args);

  const slot = state.availableSlots.find((offered) => offered.start === start);

  if (!slot) {
    return { output: { status: "slot_not_offered" } };
  }

  try {
    if (!(await availability.isSlotAvailable(slot))) {
      return {
        state: { ...state, availableSlots: state.availableSlots.filter((item) => item !== slot) },
        output: { status: "slot_unavailable" },
      };
    }
  } catch (error) {
    if (!(error instanceof CalendarAvailabilityError)) {
      throw error;
    }

    return { output: { status: "availability_unavailable" } };
  }

  return {
    state: { ...state, availableSlots: [], selectedSlot: slot },
    output: { status: "selected", label: formatMeetingSlot(slot) },
  };
}
