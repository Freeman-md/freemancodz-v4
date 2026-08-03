import type { BookMeetingInput } from "../schemas/tools/book-meeting.schema";
import type { IWorkflowService } from "../interfaces/workflow.service.interface";
import type { WorkflowState } from "../workflow.state";
import {
  MEETING_CONFIG,
  MeetingPersistenceError,
  type IMeetingService,
} from "@/server/modules/meeting/public";

export async function bookMeeting(
  _input: BookMeetingInput,
  dependencies: {
    workflow: IWorkflowService;
    meetingService: IMeetingService;
    state: WorkflowState;
  },
) {
  const { state } = dependencies;

  if (!state.confirmed || !state.name || !state.email || !state.reason || !state.selectedSlot) {
    return {
      output: {
        error: "confirmation_required",
        message: "A complete booking summary must be explicitly confirmed before booking.",
      },
      state,
    };
  }

  if (state.pendingBooking) {
    try {
      await dependencies.meetingService.reconcileMeeting({
        name: state.pendingBooking.name,
        email: state.pendingBooking.email,
        reason: state.pendingBooking.reason,
        slot: state.pendingBooking.selectedSlot,
        pendingEvent: state.pendingBooking,
      });

      return {
        output: confirmedBookingOutput(state.pendingBooking),
        state: dependencies.workflow.reset(),
      };
    } catch (error) {
      if (error instanceof MeetingPersistenceError) {
        return {
          output: {
            error: "booking_recovery_required",
            message:
              "Your calendar event was created, but we could not finish recording it yet. Please try again shortly.",
          },
          state: dependencies.workflow.recordPendingBooking(state, {
            ...error.pendingEvent,
            name: state.name,
            email: state.email,
            timezone: MEETING_CONFIG.timezone,
            reason: state.reason,
            selectedSlot: state.selectedSlot,
          }),
        };
      }

      throw error;
    }
  }

  if (!(await dependencies.meetingService.isSlotAvailable(state.selectedSlot))) {
    return {
      output: {
        error: "slot_unavailable",
        message:
          "That slot is no longer available. Find new availability before preparing another booking.",
      },
      state: dependencies.workflow.recordAvailability(state, [], new Date().toISOString()),
    };
  }

  try {
    await dependencies.meetingService.bookMeeting({
      name: state.name,
      email: state.email,
      reason: state.reason,
      slot: state.selectedSlot,
    });
  } catch (error) {
    if (error instanceof MeetingPersistenceError) {
      return {
        output: {
          error: "booking_recovery_required",
          message:
            "Your calendar event was created, but we could not finish recording it yet. Please try again shortly.",
        },
        state: dependencies.workflow.recordPendingBooking(state, {
          ...error.pendingEvent,
          name: state.name,
          email: state.email,
          timezone: MEETING_CONFIG.timezone,
          reason: state.reason,
          selectedSlot: state.selectedSlot,
        }),
      };
    }

    throw error;
  }

  return {
    output: confirmedBookingOutput(state),
    state: dependencies.workflow.reset(),
  };
}

function confirmedBookingOutput(state: Pick<WorkflowState, "email" | "selectedSlot">) {
  return {
    kind: "meeting_booking",
    status: "confirmed",
    attendeeEmail: state.email!,
    start: state.selectedSlot!.start,
    end: state.selectedSlot!.end,
    timezone: MEETING_CONFIG.timezone,
  };
}
