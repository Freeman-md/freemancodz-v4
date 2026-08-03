import type { BookMeetingInput } from "../schemas/tools/book-meeting.schema";
import type { IMeetingWorkflowService } from "../interfaces/meeting-workflow.service.interface";
import type { MeetingWorkflowState } from "../workflow/meeting-workflow.state";
import { MeetingPersistenceError, type IMeetingService } from "@/server/modules/meeting/public";

export async function bookMeeting(
  _input: BookMeetingInput,
  dependencies: {
    workflow: IMeetingWorkflowService;
    meetingService: IMeetingService;
    state: MeetingWorkflowState;
  },
) {
  const { state } = dependencies;

  if (
    !state.confirmed ||
    !state.name ||
    !state.email ||
    !state.timezone ||
    !state.reason ||
    !state.selectedSlot
  ) {
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
      const booking = await dependencies.meetingService.reconcileMeeting({ name: state.pendingBooking.name, email: state.pendingBooking.email, timezone: state.pendingBooking.timezone, reason: state.pendingBooking.reason, slot: state.pendingBooking.selectedSlot, pendingEvent: state.pendingBooking });

      return { output: { kind: "meeting_booking", status: "confirmed", ...booking }, state: dependencies.workflow.reset() };
    } catch (error) {
      if (error instanceof MeetingPersistenceError) {
        return { output: { error: "booking_recovery_required", message: "Your calendar event was created, but we could not finish recording it yet. Please try again shortly." }, state: dependencies.workflow.recordPendingBooking(state, { ...error.pendingEvent, name: state.name, email: state.email, timezone: state.timezone, reason: state.reason, selectedSlot: state.selectedSlot }) };
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

  let booking;

  try {
    booking = await dependencies.meetingService.bookMeeting({ name: state.name, email: state.email, timezone: state.timezone, reason: state.reason, slot: state.selectedSlot });
  } catch (error) {
    if (error instanceof MeetingPersistenceError) {
      return { output: { error: "booking_recovery_required", message: "Your calendar event was created, but we could not finish recording it yet. Please try again shortly." }, state: dependencies.workflow.recordPendingBooking(state, { ...error.pendingEvent, name: state.name, email: state.email, timezone: state.timezone, reason: state.reason, selectedSlot: state.selectedSlot }) };
    }

    throw error;
  }

  return {
    output: { kind: "meeting_booking", status: "confirmed", ...booking },
    state: dependencies.workflow.reset(),
  };
}
