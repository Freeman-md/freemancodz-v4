import "server-only";

import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import type { MeetingServiceClient } from "@/modules/meeting/types";
import type { IWorkflowDefinition, IWorkflowProgressProjector } from "../../interfaces";
import type {
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

export class MeetingBookingWorkflowDefinition implements IWorkflowDefinition<MeetingBookingState> {
  readonly id = MEETING_BOOKING_WORKFLOW_ID;

  readonly version = 1;

  readonly description = "Book a 30-minute meeting with Freeman.";

  readonly stateSchema = meetingBookingStateSchema;

  constructor(
    private readonly meetingService: MeetingServiceClient,
    private readonly progress: IWorkflowProgressProjector<MeetingBookingState>,
  ) {}

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

  getProgress(state: MeetingBookingState, status: "active" | "completed" | "cancelled") {
    return this.progress.getProgress(state, status);
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

    return `${MEETING_INSTRUCTIONS}\nFind genuine availability and collect only the next missing detail, normally one answer or two closely related answers. Reuse any known name, email, reason and slot preference. Once the required details and exactly one returned slot are known, call prepare_meeting to save them together. The preparation does not book anything.`;
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

const MEETING_INSTRUCTIONS = `You are coordinating Freeman's meeting-booking workflow.
Begin with a brief conversational acknowledgement and the next useful question. Collect the reason, scheduling preferences and contact details gradually rather than asking for a full intake list. Prefer ordinary chat for substantive questions; never make a form a prerequisite to continue.
Retain and reuse all valid details the visitor volunteers together, including corrections, and never ask for known answers again. Save them through the available preparation tool once its required details and a genuine returned slot are known; do not claim details were saved before a tool confirms it. Your suggestions and examples are not visitor facts unless the visitor explicitly adopts them.
Meetings are available only in Europe/London. Never ask for or pass a visitor timezone. Present slots and summaries in London time, never raw UTC. Offer only genuine returned availability, never invented dates or times.
Answer unrelated portfolio questions normally, using website search when needed, without cancelling this workflow or forcing the visitor back into collection.
A real booking requires a prepared summary and explicit confirmation in a subsequent visitor message. Supplying details, selecting a slot, or saying continue never counts as confirmation to book. Never expose provider payloads, event identifiers or Calendar URLs.`;
