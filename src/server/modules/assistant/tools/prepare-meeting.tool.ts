import type { PrepareMeetingInput } from "../schemas/tools/prepare-meeting.schema";
import type { IMeetingWorkflowService } from "../interfaces/meeting-workflow.service.interface";
import type { MeetingWorkflowState } from "../workflow/meeting-workflow.state";

export function prepareMeeting(
  input: PrepareMeetingInput,
  dependencies: { workflow: IMeetingWorkflowService; state: MeetingWorkflowState },
) {
  if (dependencies.state.pendingBooking) {
    return { output: { error: "booking_recovery_required", message: "Your calendar event is awaiting confirmation in our records. Please retry booking shortly." }, state: dependencies.state };
  }

  const state = dependencies.workflow.prepare(dependencies.state, input);

  if (!state) {
    return {
      output: {
        error: "invalid_slot",
        message:
          "The selected slot is not in the latest availability result. Find availability again.",
      },
      state: dependencies.state,
    };
  }

  return {
    output: {
      kind: "meeting_preparation",
      summary: {
        name: state.name,
        email: state.email,
        timezone: state.timezone,
        reason: state.reason,
        start: state.selectedSlot?.start,
        end: state.selectedSlot?.end,
      },
      requires_confirmation: true,
    },
    state,
  };
}
