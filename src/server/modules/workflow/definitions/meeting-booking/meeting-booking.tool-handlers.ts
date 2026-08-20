import type { Prisma } from "@/generated/prisma/client";
import {
  MEETING_CONFIG,
  MeetingPersistenceError,
  type IMeetingService,
  type MeetingSlot,
} from "@/server/modules/meeting/public";
import type { WorkflowExecutionContext, WorkflowExecutionResult } from "../../workflow.types";
import { formatMeetingSlot } from "./meeting-slot.mapper";
import {
  findMeetingSlotsSchema,
  meetingProviderPayloadSchema,
  noArgumentsSchema,
  prepareMeetingSchema,
  type FindMeetingSlotsInput,
  type MeetingBookingState,
  type PrepareMeetingInput,
} from "./meeting-booking.schema";
import {
  BOOK_MEETING_TOOL,
  CONFIRM_MEETING_TOOL,
  FIND_MEETING_SLOTS_TOOL,
  PREPARE_MEETING_TOOL,
} from "./meeting-booking.tools";

type ExecuteMeetingBookingToolInput = {
  meetingService: IMeetingService;
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

  if (name === CONFIRM_MEETING_TOOL.name) {
    return noArgumentsSchema.safeParse(args).success
      ? confirmMeeting(state, context)
      : active(state, invalidArguments());
  }

  if (name === BOOK_MEETING_TOOL.name) {
    return noArgumentsSchema.safeParse(args).success
      ? bookMeeting(meetingService, state)
      : active(state, invalidArguments());
  }

  return active(state, {
    error: "unknown_tool",
    message: "The requested workflow action is not available.",
  });
}

async function findMeetingSlots(
  meetingService: IMeetingService,
  input: FindMeetingSlotsInput,
  state: MeetingBookingState,
): Promise<WorkflowExecutionResult<MeetingBookingState>> {
  if (state.pendingBooking) {
    return active(state, bookingRecoveryOutput());
  }

  if (!isValidDateRange(input)) {
    return active(state, {
      error: "invalid_date_range",
      message: "Choose a future date range of up to 14 days.",
    });
  }

  const slots = await meetingService.findAvailableSlots(input);

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
  if (state.pendingBooking) {
    return active(state, bookingRecoveryOutput());
  }

  const selectedSlot = state.availableSlots.find((slot) => slotsMatch(slot, input.selectedSlot));

  if (!selectedSlot) {
    return active(state, {
      error: "invalid_slot",
      message:
        "The selected slot is not in the latest availability result. Find availability again.",
    });
  }

  const nextState: MeetingBookingState = {
    ...state,
    step: "awaiting_confirmation",
    name: input.name,
    email: input.email,
    reason: input.reason,
    selectedSlot: withLondonTimezone(selectedSlot),
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
    message: "Present this exact summary and ask the visitor to confirm it explicitly.",
  });
}

function confirmMeeting(
  state: MeetingBookingState,
  context: WorkflowExecutionContext,
): WorkflowExecutionResult<MeetingBookingState> {
  if (
    state.step !== "awaiting_confirmation" ||
    !state.name ||
    !state.email ||
    !state.reason ||
    !state.selectedSlot
  ) {
    return active(state, {
      error: "preparation_required",
      message: "Prepare a complete booking summary before confirmation.",
    });
  }

  if (state.preparedInteractionId === context.interactionId) {
    return active(state, {
      error: "confirmation_requires_new_input",
      message: "Wait for the visitor to explicitly confirm the prepared summary.",
    });
  }

  return active(
    { ...state, step: "confirmed" },
    {
      kind: "meeting_confirmation",
      status: "confirmed",
      message: "The visitor explicitly confirmed the prepared summary.",
    },
  );
}

async function bookMeeting(
  meetingService: IMeetingService,
  state: MeetingBookingState,
): Promise<WorkflowExecutionResult<MeetingBookingState>> {
  if (
    state.step !== "confirmed" ||
    !state.name ||
    !state.email ||
    !state.reason ||
    !state.selectedSlot
  ) {
    return active(state, {
      error: "confirmation_required",
      message: "A complete booking summary must be explicitly confirmed before booking.",
    });
  }

  if (state.pendingBooking) {
    return reconcilePendingBooking(meetingService, state);
  }

  if (!(await meetingService.isSlotAvailable(state.selectedSlot))) {
    return active(
      {
        ...state,
        step: "collecting",
        availableSlots: [],
        availabilityCheckedAt: new Date().toISOString(),
        selectedSlot: null,
        preparedInteractionId: null,
      },
      {
        error: "slot_unavailable",
        message:
          "That slot is no longer available. Find new availability before preparing another booking.",
      },
    );
  }

  try {
    await meetingService.bookMeeting({
      name: state.name,
      email: state.email,
      reason: state.reason,
      slot: state.selectedSlot,
    });
  } catch (error) {
    if (error instanceof MeetingPersistenceError) {
      return active(
        {
          ...state,
          pendingBooking: {
            ...error.pendingEvent,
            rawProviderPayload: meetingProviderPayloadSchema.parse(
              error.pendingEvent.rawProviderPayload,
            ),
            name: state.name,
            email: state.email,
            reason: state.reason,
            selectedSlot: state.selectedSlot,
          },
        },
        bookingRecoveryOutput(),
      );
    }

    throw error;
  }

  return completed(state, confirmedBookingOutput(state));
}

async function reconcilePendingBooking(
  meetingService: IMeetingService,
  state: MeetingBookingState,
): Promise<WorkflowExecutionResult<MeetingBookingState>> {
  const pendingBooking = state.pendingBooking;

  if (!pendingBooking || !state.email || !state.selectedSlot) {
    return active(state, {
      error: "booking_recovery_required",
      message: "The pending booking could not be reconciled safely.",
    });
  }

  try {
    await meetingService.reconcileMeeting({
      name: pendingBooking.name,
      email: pendingBooking.email,
      reason: pendingBooking.reason,
      slot: pendingBooking.selectedSlot,
      pendingEvent: pendingBooking,
    });
  } catch (error) {
    if (error instanceof MeetingPersistenceError) {
      return active(state, bookingRecoveryOutput());
    }

    throw error;
  }

  return completed({ ...state, pendingBooking: null }, confirmedBookingOutput(state));
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

function completed(
  state: MeetingBookingState,
  output: Prisma.JsonObject,
): WorkflowExecutionResult<MeetingBookingState> {
  return { state, status: "completed", output };
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
    message:
      "Your calendar event was created, but we could not finish recording it yet. Please try again shortly.",
  };
}

function confirmedBookingOutput(state: Pick<MeetingBookingState, "email" | "selectedSlot">) {
  return {
    kind: "meeting_booking",
    status: "confirmed",
    attendeeEmail: state.email!,
    start: state.selectedSlot!.start,
    end: state.selectedSlot!.end,
    timezone: MEETING_CONFIG.timezone,
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
