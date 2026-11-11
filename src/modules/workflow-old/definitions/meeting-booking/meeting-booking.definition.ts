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
  FIND_MEETING_SLOTS_TOOL,
  PREPARE_MEETING_TOOL,
  UPDATE_MEETING_CONTEXT_TOOL,
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
      bookingOperation: null,
      pendingBooking: null,
    };
  }

  getProgress(state: MeetingBookingState, status: "active" | "completed" | "cancelled") {
    return this.progress.getProgress(state, status);
  }

  getInstructions(state: MeetingBookingState): string {
    if (state.pendingBooking) {
      return `${MEETING_INSTRUCTIONS}\nA Calendar event already exists but recording it is pending. The application owns recovery. Do not change the booking details, find another slot or claim the booking is complete.`;
    }

    if (state.step === "awaiting_confirmation") {
      return `${MEETING_INSTRUCTIONS}\nThe application displays the saved summary and a Confirm booking button. Ask the visitor to review it and use that button. Ordinary messages, including yes or continue, cannot confirm or book a meeting.`;
    }

    if (state.step === "confirmed") {
      return `${MEETING_INSTRUCTIONS}\nBooking has been accepted or requires recovery. The application owns booking and retry actions. Do not change details, switch workflows or claim completion unless the saved workflow is completed.`;
    }

    return `${MEETING_INSTRUCTIONS}\nFind genuine availability and collect only the next missing detail, normally one answer or two closely related answers. Reuse any known name, email, reason and slot preference. Once the required details and exactly one returned slot are known, call prepare_meeting to save them together. The preparation does not book anything.`;
  }

  getTools(state: MeetingBookingState): OpenAIResponseTool[] {
    if (state.pendingBooking || state.bookingOperation || state.step === "confirmed") {
      return [];
    }

    if (state.step === "awaiting_confirmation") {
      return [FIND_MEETING_SLOTS_TOOL, PREPARE_MEETING_TOOL, UPDATE_MEETING_CONTEXT_TOOL];
    }

    return state.availableSlots.length > 0
      ? [FIND_MEETING_SLOTS_TOOL, PREPARE_MEETING_TOOL, UPDATE_MEETING_CONTEXT_TOOL]
      : [FIND_MEETING_SLOTS_TOOL, UPDATE_MEETING_CONTEXT_TOOL];
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
Retain and reuse all valid details the visitor volunteers together, including corrections, and never ask for known answers again. Call update_meeting_context immediately for every supplied name, email, reason or selection from genuine returned availability, even if other details or availability are still missing. Once all required details are saved, call prepare_meeting with the complete summary. Do not claim details were saved before a tool confirms it. Your suggestions and examples are not visitor facts unless the visitor explicitly adopts them.
Meetings are available only in Europe/London. Never ask for or pass a visitor timezone. Present slots and summaries in London time, never raw UTC. Offer only genuine returned availability, never invented dates or times.
Answer unrelated portfolio questions normally, using website search when needed, without cancelling this workflow or forcing the visitor back into collection.
A real booking requires a prepared summary and the application's explicit Confirm booking action. Supplying details, selecting a slot, ordinary chat or saying continue never counts as confirmation to book. Never expose provider payloads, event identifiers or Calendar URLs.`;
