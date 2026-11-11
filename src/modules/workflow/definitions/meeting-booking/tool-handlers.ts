import { CalendarAvailabilityError } from "@/infrastructure/google-calendar/types";
import { MEETING_CONFIG } from "@/modules/meeting/config";
import { getLondonDate, resolveMeetingTime } from "@/modules/meeting/time";
import type { MeetingAvailability, MeetingSlot } from "@/modules/meeting/types";
import type { WorkflowToolResult } from "../../types";
import {
  findSlotsArgumentsSchema,
  identityArgumentsSchema,
  meetingStateSchema,
  selectSlotArgumentsSchema,
  topicArgumentsSchema,
} from "./schema";

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

export function saveMeetingIdentity(savedState: unknown, args: unknown): WorkflowToolResult {
  const state = meetingStateSchema.parse(savedState);

  const { name, email } = identityArgumentsSchema.parse(args);

  return {
    state: { ...state, name: name ?? state.name, email: email ?? state.email },
    output: { status: "saved" },
  };
}

export async function findMeetingSlots(
  availability: MeetingAvailability,
  savedState: unknown,
  args: unknown,
  now = new Date(),
): Promise<WorkflowToolResult> {
  const state = meetingStateSchema.parse(savedState);

  const { startDate, endDate, preferredTime } = findSlotsArgumentsSchema.parse(args);

  const today = getLondonDate(now);

  const requested = preferredTime
    ? resolveMeetingTime(preferredTime.date, preferredTime.time, preferredTime.timeZone)
    : null;

  if (preferredTime && !requested) {
    return {
      output: {
        status: "invalid_preferred_time",
        message: "Ask for an unambiguous time and timezone.",
      },
    };
  }

  const requestedDate = requested && getLondonDate(requested);

  const windowEnd = new Date(Date.parse(today) + 6 * 86_400_000).toISOString().slice(0, 10);

  const range = {
    startDate: requestedDate ?? startDate ?? today,
    endDate: requestedDate ?? endDate ?? windowEnd,
  };

  const daysBetween = (Date.parse(range.endDate) - Date.parse(range.startDate)) / 86_400_000;

  if (
    range.startDate < today ||
    (requested && requested <= now) ||
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
    const available = await availability.findAvailableSlots(range);

    const exact =
      requested && available.find(({ start }) => Date.parse(start) === requested.getTime());

    const slots = exact ? [exact] : available.slice(0, 4);

    const offered = slots.map((slot) => ({ start: slot.start, label: formatMeetingSlot(slot) }));

    return {
      state: { ...state, availableSlots: slots },
      replyOptions: offered.map(({ label }) => label),
      output: {
        status: slots.length > 0 ? "available" : "no_slots",
        ...(requested ? { requestedTimeAvailable: Boolean(exact) } : {}),
        slots: offered,
      },
    };
  } catch (error) {
    if (!(error instanceof CalendarAvailabilityError)) {
      throw error;
    }

    return {
      output: {
        status: "availability_unavailable",
        message:
          "Freeman's calendar is temporarily unavailable. Offer to retry later or direct the visitor to Contact.",
      },
    };
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

    return {
      output: {
        status: "availability_unavailable",
        message:
          "Freeman's calendar is temporarily unavailable. Offer to retry later or direct the visitor to Contact.",
      },
    };
  }

  return {
    state: { ...state, availableSlots: [], selectedSlot: slot },
    output: { status: "selected", label: formatMeetingSlot(slot) },
  };
}
