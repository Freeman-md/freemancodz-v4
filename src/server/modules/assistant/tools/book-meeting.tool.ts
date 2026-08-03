import type { BookMeetingInput } from "../schemas/tools/book-meeting.schema";
import type { MeetingWorkflowService } from "../workflow/meeting-workflow.service";
import type { MeetingWorkflowState } from "../workflow/meeting-workflow.state";
import type { IMeetingService } from "@/server/modules/meeting/public";

export async function bookMeeting(_input: BookMeetingInput, dependencies: { workflow: MeetingWorkflowService; meetingService: IMeetingService; state: MeetingWorkflowState }) {
  const { state } = dependencies;

  if (!state.confirmed || !state.name || !state.email || !state.timezone || !state.reason || !state.selectedSlot) {return { output: { error: "confirmation_required", message: "A complete booking summary must be explicitly confirmed before booking." }, state };}

  if (!await dependencies.meetingService.isSlotAvailable(state.selectedSlot)) {return { output: { error: "slot_unavailable", message: "That slot is no longer available. Find new availability before preparing another booking." }, state: dependencies.workflow.recordAvailability(state, [], new Date().toISOString()) };}

  const booking = await dependencies.meetingService.bookMeeting({ name: state.name, email: state.email, timezone: state.timezone, reason: state.reason, slot: state.selectedSlot });

  return { output: { kind: "meeting_booking", status: "confirmed", ...booking }, state: dependencies.workflow.reset() };
}
