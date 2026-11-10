import { MeetingPersistenceError } from "./v1-meeting-store";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { CalendarAvailabilityError } from "@/infrastructure/google-calendar/types";
import { MEETING_CONFIG } from "@/modules/meeting/config";
import {
  MeetingBookingError,
  type MeetingServiceClient,
  type BookMeetingInput,
  type MeetingBookingDetails,
  type PendingCalendarEvent,
  type MeetingSlot,
} from "@/modules/meeting/types";
import { MeetingBookingWorkflowDefinition } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.definition";
import type { MeetingBookingState } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.schema";
import { formatMeetingSlot } from "@/modules/workflow/definitions/meeting-booking/meeting-slot.mapper";
import type { IWorkflowProgressProjector } from "@/modules/workflow/interfaces";
import type { WorkflowExecutionResult } from "@/modules/workflow/types";

export type V1MeetingClient = MeetingServiceClient & {
  isSlotAvailable(slot: MeetingSlot): Promise<boolean>;
  bookMeeting(
    input: BookMeetingInput,
  ): Promise<{ googleEventId: string; googleEventUrl: string | null }>;
  reconcileMeeting(
    input: MeetingBookingDetails & {
      pendingEvent: PendingCalendarEvent;
      bookingOperationId?: string;
    },
  ): Promise<{ googleEventId: string; googleEventUrl: string | null }>;
};

export class V1BookingDefinition extends MeetingBookingWorkflowDefinition {
  constructor(
    private readonly v1Meeting: V1MeetingClient,
    progress: IWorkflowProgressProjector<MeetingBookingState>,
  ) {
    super(v1Meeting, progress);
  }

  confirmLegacy(state: MeetingBookingState, interactionId: string, expectedRevision: number) {
    return confirmLegacyMeeting(this.v1Meeting, state, { interactionId, expectedRevision });
  }

  bookLegacy(state: MeetingBookingState) {
    return bookLegacyMeeting(this.v1Meeting, state);
  }
}

export async function confirmLegacyMeeting(
  meetingService: V1MeetingClient,
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
  meetingService: V1MeetingClient,
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
  meetingService: V1MeetingClient,
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

function bookingRecoveryOutput() {
  return {
    error: "booking_recovery_required",
    message: "Use Retry booking to check the saved booking.",
  };
}
