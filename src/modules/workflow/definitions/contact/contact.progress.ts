import type { WorkflowProgress } from "@/contracts/workflow-progress.contract";
import type { IWorkflowProgressProjector } from "../../interfaces";
import type { WorkflowInstanceStatus } from "../../types";
import type { ContactState } from "./contact.schema";

const REQUIRED_FIELDS = ["name", "email", "message"] as const;

const OPTIONAL_FIELDS = ["businessName"] as const;

export class ContactWorkflowProgressProjector implements IWorkflowProgressProjector<ContactState> {
  getProgress(state: ContactState, status: WorkflowInstanceStatus): WorkflowProgress {
    const missingRequiredFields = this.getMissingRequiredFields(state);

    return {
      phase: this.getPhase(state, status),
      fields: [
        ...REQUIRED_FIELDS.map((key) => ({ key, required: true, value: state[key] })),
        ...OPTIONAL_FIELDS.map((key) => ({ key, required: false, value: state[key] })),
      ],
      missingRequiredFields,
    };
  }

  getMissingRequiredFields(state: ContactState) {
    return REQUIRED_FIELDS.filter((field) => !state[field]);
  }

  private getPhase(state: ContactState, status: WorkflowInstanceStatus): WorkflowProgress["phase"] {
    if (status !== "active") {
      return status;
    }

    if (state.confirmedRevision != null) {
      return "processing";
    }

    return state.preparedInteractionId ? "awaiting_confirmation" : "collecting";
  }
}
