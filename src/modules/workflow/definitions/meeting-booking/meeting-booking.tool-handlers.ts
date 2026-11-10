import type { Prisma } from "@/generated/prisma/client";
import { MEETING_CONFIG } from "@/modules/meeting/config";
import { CalendarAvailabilityError } from "@/infrastructure/google-calendar/types";
import { type MeetingServiceClient, type MeetingSlot } from "@/modules/meeting/types";
import type { WorkflowExecutionContext, WorkflowExecutionResult } from "../../types";
import { formatMeetingSlot } from "./meeting-slot.mapper";
import {
  findMeetingSlotsSchema,
  prepareMeetingSchema,
  updateMeetingContextSchema,
  type MeetingContextUpdate,
  type FindMeetingSlotsInput,
  type MeetingBookingState,
  type PrepareMeetingInput,
} from "./meeting-booking.schema";
import { FIND_MEETING_SLOTS_TOOL, PREPARE_MEETING_TOOL } from "./meeting-booking.tools";

type ExecuteMeetingBookingToolInput = {
  meetingService: MeetingServiceClient;
  name: string;
  rawArguments: string;
  state: MeetingBookingState;
  context: WorkflowExecutionContext;
};

export async function executeMeetingBookingTool({
  meetingService,
  name,
  rawArguments,
  state,
  context,
}: ExecuteMeetingBookingToolInput): Promise<WorkflowExecutionResult<MeetingBookingState>> {
  const args = parseArguments(rawArguments);

  if (!args) {
    return active(state, invalidArguments());
  }

  if (name === "update_meeting_context") {
    const parsed = updateMeetingContextSchema.safeParse(args);

    return parsed.success
      ? updateMeetingContext(state, parsed.data.updates)
      : active(state, invalidArguments());
  }

  if (name === FIND_MEETING_SLOTS_TOOL.name) {
    const parsed = findMeetingSlotsSchema.safeParse(args);

    return parsed.success
      ? findMeetingSlots(meetingService, parsed.data, state)
      : active(state, invalidArguments());
  }

  if (name === PREPARE_MEETING_TOOL.name) {
    const parsed = prepareMeetingSchema.safeParse(args);

    return parsed.success
      ? prepareMeeting(parsed.data, state, context)
      : active(state, invalidArguments());
  }

  return active(state, {
    error: "unknown_tool",
    message: "The requested workflow action is not available.",
  });
}

async function findMeetingSlots(
  meetingService: MeetingServiceClient,
  input: FindMeetingSlotsInput,
  state: MeetingBookingState,
): Promise<WorkflowExecutionResult<MeetingBookingState>> {
  if (state.pendingBooking || state.bookingOperation || state.step === "confirmed") {
    return active(state, bookingRecoveryOutput());
  }

  if (!isValidDateRange(input)) {
    return active(state, {
      error: "invalid_date_range",
      message: "Choose a future date range of up to 14 days.",
    });
  }

  let slots: MeetingSlot[];

  try {
    slots = await meetingService.findAvailableSlots(input);
  } catch (error) {
    if (!(error instanceof CalendarAvailabilityError)) {
      throw error;
    }

    return active(
      {
        ...state,
        step: "collecting",
        availableSlots: [],
        availabilityCheckedAt: null,
        selectedSlot: null,
        preparedInteractionId: null,
      },
      {
        error: "meeting_availability_unavailable",
        message:
          "Meeting availability is temporarily unavailable. Explain this briefly and ask the visitor to try again later. Do not invent slots, prepare a booking or claim anything was booked.",
      },
    );
  }

  return active(
    {
      ...state,
      step: "collecting",
      availableSlots: slots.map(withLondonTimezone),
      availabilityCheckedAt: new Date().toISOString(),
      selectedSlot: null,
      preparedInteractionId: null,
    },
    {
      kind: "meeting_slots",
      timezone: MEETING_CONFIG.timezone,
      slots: slots.map((slot) => ({
        ...withLondonTimezone(slot),
        label: formatMeetingSlot(slot),
      })),
    },
  );
}

function prepareMeeting(
  input: PrepareMeetingInput,
  state: MeetingBookingState,
  context: WorkflowExecutionContext,
): WorkflowExecutionResult<MeetingBookingState> {
  if (state.pendingBooking || state.bookingOperation || state.step === "confirmed") {
    return active(state, bookingRecoveryOutput());
  }

  const updated = updateMeetingContext(state, [
    { field: "name", value: input.name },
    { field: "email", value: input.email },
    { field: "reason", value: input.reason },
    { field: "selectedSlot", value: input.selectedSlot },
  ]);

  if ("error" in updated.output) {
    return updated;
  }

  const nextState: MeetingBookingState = {
    ...updated.state,
    step: "awaiting_confirmation",
    preparedInteractionId: context.interactionId,
  };

  return active(nextState, {
    kind: "meeting_preparation",
    summary: {
      name: nextState.name,
      email: nextState.email,
      timezone: MEETING_CONFIG.timezone,
      reason: nextState.reason,
      slot: formatMeetingSlot(nextState.selectedSlot!),
    },
    requiresConfirmation: true,
    message: "The application displays this saved summary. Ask the visitor to use Confirm booking.",
  });
}

function updateMeetingContext(
  state: MeetingBookingState,
  updates: MeetingContextUpdate[],
): WorkflowExecutionResult<MeetingBookingState> {
  if (state.pendingBooking || state.bookingOperation || state.step === "confirmed") {
    return active(state, bookingRecoveryOutput());
  }

  const next = { ...state };

  let changed = false;

  for (const update of updates) {
    if (update.field === "selectedSlot") {
      if (typeof update.value === "string") {
        return active(state, invalidArguments());
      }

      const slot = state.availableSlots.find((slot) => slotsMatch(slot, update.value));

      if (!slot) {
        return active(state, {
          error: "invalid_slot",
          message:
            "The selected slot is not in the latest availability result. Find availability again.",
        });
      }

      changed ||= !state.selectedSlot || !slotsMatch(state.selectedSlot, slot);
      next.selectedSlot = withLondonTimezone(slot);
    } else {
      if (typeof update.value !== "string") {
        return active(state, invalidArguments());
      }

      changed ||= state[update.field] !== update.value;
      next[update.field] = update.value;
    }
  }

  if (changed) {
    next.step = "collecting";
    next.preparedInteractionId = null;
  }

  return active(next, {
    kind: "context_updated",
    message:
      "Meeting details saved. Ask only for information still missing, then prepare the complete summary.",
  });
}

function parseArguments(rawArguments: string): unknown | null {
  try {
    return JSON.parse(rawArguments);
  } catch {
    return null;
  }
}

function active(
  state: MeetingBookingState,
  output: Prisma.JsonObject,
): WorkflowExecutionResult<MeetingBookingState> {
  return { state, status: "active", output };
}

function invalidArguments() {
  return {
    error: "invalid_arguments",
    message: "Tool arguments did not match the required schema.",
  };
}

function bookingRecoveryOutput() {
  return {
    error: "booking_recovery_required",
    message: "Check the saved status before changing your booking.",
  };
}

function slotsMatch(
  left: Pick<MeetingSlot, "start" | "end">,
  right: Pick<MeetingSlot, "start" | "end">,
) {
  return left.start === right.start && left.end === right.end;
}

function withLondonTimezone(slot: MeetingSlot): MeetingSlot {
  return { ...slot, timezone: MEETING_CONFIG.timezone };
}

function isValidDateRange(input: FindMeetingSlotsInput) {
  const start = new Date(`${input.startDate}T00:00:00Z`);

  const end = new Date(`${input.endDate}T00:00:00Z`);

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: MEETING_CONFIG.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("/", "-");

  return (
    start <= end &&
    end.getTime() - start.getTime() <= MEETING_CONFIG.maximumRangeDays * 86_400_000 &&
    input.endDate >= today
  );
}
