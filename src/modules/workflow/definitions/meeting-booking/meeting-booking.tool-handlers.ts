import type { Prisma } from "@/generated/prisma/client";
import { randomUUID } from "node:crypto";
import { MEETING_CONFIG } from "@/modules/meeting/config";
import { CalendarAvailabilityError } from "@/infrastructure/google-calendar/types";
import {
  MeetingPersistenceError,
  MeetingBookingError,
  type MeetingServiceClient,
  type MeetingSlot,
} from "@/modules/meeting/types";
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

export async function confirmLegacyMeeting(
  meetingService: MeetingServiceClient,
  state: MeetingBookingState,
  context: { interactionId: string; expectedRevision: number },
): Promise<WorkflowExecutionResult<MeetingBookingState>> {
  if (!Number.isInteger(context.expectedRevision) || context.expectedRevision < 0) {
    return active(state, {
      error: "separate_confirmation_required",
      message: "Continuing or switching cannot confirm booking. Wait for a separate confirmation.",
    });
  }

  if (state.pendingBooking || state.bookingOperation) {
    return active(state, bookingRecoveryOutput());
  }

  if (
    state.step !== "awaiting_confirmation" ||
    !state.name ||
    !state.email ||
    !state.reason ||
    !state.preparedInteractionId ||
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

  try {
    if (!(await meetingService.isSlotAvailable(state.selectedSlot))) {
      return active(
        {
          ...state,
          step: "collecting",
          availableSlots: [],
          selectedSlot: null,
          preparedInteractionId: null,
        },
        {
          error: "slot_unavailable",
          message: "That slot is no longer available. Choose a new time before confirming again.",
        },
      );
    }
  } catch (error) {
    if (!(error instanceof CalendarAvailabilityError)) {
      throw error;
    }

    return active(state, {
      error: "meeting_availability_unavailable",
      message:
        "Meeting availability is temporarily unavailable. Please try confirming again later.",
    });
  }

  return active(
    {
      ...state,
      step: "confirmed",
      bookingOperation: { id: randomUUID(), preparedRevision: context.expectedRevision },
    },
    {
      kind: "meeting_confirmation",
      status: "confirmed",
      message: "The visitor explicitly confirmed the prepared summary.",
    },
  );
}

export async function bookLegacyMeeting(
  meetingService: MeetingServiceClient,
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

  if (!state.bookingOperation) {
    return active(state, {
      error: "booking_recovery_blocked",
      message:
        "This saved booking cannot be retried safely. Please contact Freeman to check its status.",
    });
  }

  try {
    await meetingService.bookMeeting({
      bookingOperationId: state.bookingOperation.id,
      name: state.name,
      email: state.email,
      reason: state.reason,
      slot: state.selectedSlot,
    });
  } catch (error) {
    if (error instanceof MeetingBookingError || error instanceof MeetingPersistenceError) {
      return active(state, bookingRecoveryOutput());
    }

    throw error;
  }

  return completed(state, confirmedBookingOutput(state));
}

async function reconcilePendingBooking(
  meetingService: MeetingServiceClient,
  state: MeetingBookingState,
): Promise<WorkflowExecutionResult<MeetingBookingState>> {
  const pendingBooking = state.pendingBooking;

  if (!pendingBooking || !state.email || !state.selectedSlot) {
    return active(state, {
      error: "booking_recovery_required",
      message: "The pending booking could not be reconciled safely.",
    });
  }

  const summaryMatches =
    pendingBooking.name === state.name &&
    pendingBooking.email.trim().toLowerCase() === state.email.trim().toLowerCase() &&
    pendingBooking.reason === state.reason &&
    slotsMatch(pendingBooking.selectedSlot, state.selectedSlot) &&
    pendingBooking.selectedSlot.timezone === state.selectedSlot.timezone;

  const operationMatches =
    !state.bookingOperation ||
    pendingBooking.googleEventId ===
      `b${state.bookingOperation.id.replaceAll("-", "").toLowerCase()}`;

  if (!summaryMatches || !operationMatches) {
    return active(state, {
      error: "booking_recovery_blocked",
      message:
        "This saved booking does not match its confirmed summary. Please contact Freeman to check its status.",
    });
  }

  try {
    await meetingService.reconcileMeeting({
      bookingOperationId: state.bookingOperation?.id,
      name: pendingBooking.name,
      email: pendingBooking.email,
      reason: pendingBooking.reason,
      slot: pendingBooking.selectedSlot,
      pendingEvent: pendingBooking,
    });
  } catch (error) {
    if (error instanceof MeetingPersistenceError || error instanceof MeetingBookingError) {
      return active(state, bookingRecoveryOutput());
    }

    throw error;
  }

  // Legacy recovery has no operation ID; retain its known event as the terminal identity.
  return completed(
    { ...state, pendingBooking: state.bookingOperation ? null : pendingBooking },
    confirmedBookingOutput(state),
  );
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
      "We could not finish checking your booking. Use Retry booking to safely check the same booking again.",
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
    message: `Your meeting is booked for ${formatMeetingSlot(state.selectedSlot!)}. A calendar invitation will be sent to ${state.email!}.`,
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
