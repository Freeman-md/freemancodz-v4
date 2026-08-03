import type { PrepareMeetingInput } from "../schemas/tools/prepare-meeting.schema";
import type { IWorkflowService } from "../interfaces/workflow.service.interface";
import { formatMeetingSlot } from "../mappers/meeting-slot.mapper";
import type { WorkflowState } from "../workflow.state";

export function prepareMeeting(
  input: PrepareMeetingInput,
  dependencies: { workflow: IWorkflowService; state: WorkflowState },
) {
  if (dependencies.state.pendingBooking) {
    return {
      output: {
        error: "booking_recovery_required",
        message:
          "Your calendar event is awaiting confirmation in our records. Please retry booking shortly.",
      },
      state: dependencies.state,
    };
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
        slot: state.selectedSlot ? formatMeetingSlot(state.selectedSlot) : null,
      },
      requires_confirmation: true,
    },
    state,
  };
}
