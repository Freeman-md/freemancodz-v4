import "server-only";

import type { OpenAIResponseTool } from "@/server/infrastructure/openai/models/openai-response-request";
import {
  MEETING_CONFIG,
  MeetingPersistenceError,
  type IMeetingService,
  type MeetingSlot,
} from "@/server/modules/meeting/public";
import type {
  IWorkflowDefinition,
  WorkflowExecutionContext,
  WorkflowExecutionResult,
  WorkflowSemanticOutput,
  WorkflowStartContext,
} from "../../public";
import { toWorkflowJsonObject } from "../../models/workflow-json";
import { formatMeetingSlot } from "./meeting-slot.mapper";
import {
  findMeetingSlotsSchema,
  meetingBookingStateSchema,
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

export const MEETING_BOOKING_WORKFLOW_ID = "meeting-booking";

export class MeetingBookingWorkflowDefinition implements IWorkflowDefinition<MeetingBookingState> {
  readonly id = MEETING_BOOKING_WORKFLOW_ID;

  readonly version = 1;

  readonly description = "Book a 30-minute meeting with Freeman.";

  readonly stateSchema = meetingBookingStateSchema;

  constructor(private readonly meetingService: IMeetingService) {}

  createInitialState(_context: WorkflowStartContext): MeetingBookingState {
    return {
      step: "collecting",
      name: null,
      email: null,
      reason: null,
      availableSlots: [],
      availabilityCheckedAt: null,
      selectedSlot: null,
      preparedInteractionId: null,
      pendingBooking: null,
    };
  }

  getInstructions(state: MeetingBookingState): string {
    if (state.pendingBooking) {
      return `${MEETING_INSTRUCTIONS}\nA Calendar event already exists but its database record is pending. Call book_meeting to retry reconciliation; do not change the booking details or find another slot.`;
    }

    if (state.step === "awaiting_confirmation") {
      return `${MEETING_INSTRUCTIONS}\nPresent the prepared summary and ask for explicit confirmation. Do not call confirm_meeting until a subsequent visitor message clearly confirms this exact summary. Never call book_meeting at this stage.`;
    }

    if (state.step === "confirmed") {
      return `${MEETING_INSTRUCTIONS}\nThe prepared summary has been explicitly confirmed. Call book_meeting now. After success, confirm the London date and time and say a calendar invitation will be sent to the supplied email; never expose a Calendar URL.`;
    }

    return `${MEETING_INSTRUCTIONS}\nFind genuine availability, collect name, email and reason, then prepare exactly one returned slot. The preparation does not book anything.`;
  }

  getTools(state: MeetingBookingState): OpenAIResponseTool[] {
    if (state.pendingBooking || state.step === "confirmed") {
      return [BOOK_MEETING_TOOL];
    }

    if (state.step === "awaiting_confirmation") {
      return [FIND_MEETING_SLOTS_TOOL, PREPARE_MEETING_TOOL, CONFIRM_MEETING_TOOL];
    }

    return state.availableSlots.length > 0
      ? [FIND_MEETING_SLOTS_TOOL, PREPARE_MEETING_TOOL]
      : [FIND_MEETING_SLOTS_TOOL];
  }

  async executeTool(
    name: string,
    rawArguments: string,
    state: MeetingBookingState,
    context: WorkflowExecutionContext,
  ): Promise<WorkflowExecutionResult<MeetingBookingState>> {
    const args = parseArguments(rawArguments);

    if (!args) {
      return active(state, invalidArguments());
    }

    if (name === FIND_MEETING_SLOTS_TOOL.name) {
      const parsed = findMeetingSlotsSchema.safeParse(args);

      return parsed.success
        ? this.findMeetingSlots(parsed.data, state)
        : active(state, invalidArguments());
    }

    if (name === PREPARE_MEETING_TOOL.name) {
      const parsed = prepareMeetingSchema.safeParse(args);

      return parsed.success
        ? this.prepareMeeting(parsed.data, state, context)
        : active(state, invalidArguments());
    }

    if (name === CONFIRM_MEETING_TOOL.name) {
      return noArgumentsSchema.safeParse(args).success
        ? this.confirmMeeting(state, context)
        : active(state, invalidArguments());
    }

    if (name === BOOK_MEETING_TOOL.name) {
      return noArgumentsSchema.safeParse(args).success
        ? this.bookMeeting(state)
        : active(state, invalidArguments());
    }

    return active(state, {
      error: "unknown_tool",
      message: "The requested workflow action is not available.",
    });
  }

  private async findMeetingSlots(
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

    const slots = await this.meetingService.findAvailableSlots(input);

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

  private prepareMeeting(
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

  private confirmMeeting(
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

  private async bookMeeting(
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
      return this.reconcilePendingBooking(state);
    }

    if (!(await this.meetingService.isSlotAvailable(state.selectedSlot))) {
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
      await this.meetingService.bookMeeting({
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
              rawProviderPayload: toWorkflowJsonObject(
                JSON.parse(JSON.stringify(error.pendingEvent.rawProviderPayload)),
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

  private async reconcilePendingBooking(
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
      await this.meetingService.reconcileMeeting({
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
}

const MEETING_INSTRUCTIONS = `You are coordinating Freeman's meeting-booking workflow. Meetings are available only in Europe/London. Never ask for or pass a visitor timezone. Present slots and summaries in London time, never raw UTC. A real booking requires a prepared summary and explicit confirmation in a subsequent visitor message. Never expose provider payloads, event identifiers or Calendar URLs.`;

function parseArguments(rawArguments: string): unknown | null {
  try {
    return JSON.parse(rawArguments);
  } catch {
    return null;
  }
}

function active(
  state: MeetingBookingState,
  output: WorkflowSemanticOutput,
): WorkflowExecutionResult<MeetingBookingState> {
  return { state, status: "active", output };
}

function completed(
  state: MeetingBookingState,
  output: WorkflowSemanticOutput,
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
