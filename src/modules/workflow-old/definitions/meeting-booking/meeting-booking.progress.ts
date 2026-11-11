import type { WorkflowProgress } from "@/contracts/workflow-progress.contract";
import type { IWorkflowProgressProjector } from "../../interfaces";
import type { WorkflowInstanceStatus } from "../../types";
import type { MeetingBookingState } from "./meeting-booking.schema";

const REQUIRED_FIELDS = ["name", "email", "reason", "selectedSlot"] as const;

export class MeetingBookingWorkflowProgressProjector
  implements IWorkflowProgressProjector<MeetingBookingState>
{
  getProgress(state: MeetingBookingState, status: WorkflowInstanceStatus): WorkflowProgress {
    return {
      phase: this.getPhase(state, status),
      fields: REQUIRED_FIELDS.map((key) => ({ key, required: true, value: state[key] })),
      missingRequiredFields: this.getMissingRequiredFields(state),
    };
  }

  getMissingRequiredFields(state: MeetingBookingState) {
    return REQUIRED_FIELDS.filter((field) => !state[field]);
  }

  private getPhase(
    state: MeetingBookingState,
    status: WorkflowInstanceStatus,
  ): WorkflowProgress["phase"] {
    if (status !== "active") {
      return status;
    }

    if (state.pendingBooking || state.step === "confirmed") {
      return "processing";
    }

    return state.step === "awaiting_confirmation" ? "awaiting_confirmation" : "collecting";
  }
}
