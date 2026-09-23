import "server-only";

import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import type { MeetingServiceClient } from "@/modules/meeting/types";
import type {
  WorkflowDefinition,
  WorkflowExecutionContext,
  WorkflowExecutionResult,
  WorkflowStartContext,
} from "../../types";
import { executeMeetingBookingTool } from "./meeting-booking.tool-handlers";
import { meetingBookingStateSchema, type MeetingBookingState } from "./meeting-booking.schema";
import {
  BOOK_MEETING_TOOL,
  CONFIRM_MEETING_TOOL,
  FIND_MEETING_SLOTS_TOOL,
  PREPARE_MEETING_TOOL,
} from "./meeting-booking.tools";

export const MEETING_BOOKING_WORKFLOW_ID = "meeting-booking";

export class MeetingBookingWorkflowDefinition implements WorkflowDefinition<MeetingBookingState> {
  readonly id = MEETING_BOOKING_WORKFLOW_ID;

  readonly version = 1;

  readonly description = "Book a 30-minute meeting with Freeman.";

  readonly stateSchema = meetingBookingStateSchema;

  constructor(private readonly meetingService: MeetingServiceClient) {}

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

  executeTool(
    name: string,
    rawArguments: string,
    state: MeetingBookingState,
    context: WorkflowExecutionContext,
  ): Promise<WorkflowExecutionResult<MeetingBookingState>> {
    return executeMeetingBookingTool({
      meetingService: this.meetingService,
      name,
      rawArguments,
      state,
      context,
    });
  }
}

const MEETING_INSTRUCTIONS = `You are coordinating Freeman's meeting-booking workflow. Meetings are available only in Europe/London. Never ask for or pass a visitor timezone. Present slots and summaries in London time, never raw UTC. A real booking requires a prepared summary and explicit confirmation in a subsequent visitor message. Never expose provider payloads, event identifiers or Calendar URLs.`;
