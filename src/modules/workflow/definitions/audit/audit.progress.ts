import type { WorkflowProgress } from "@/contracts/workflow-progress.contract";
import type { IWorkflowProgressProjector } from "../../interfaces";
import type { WorkflowInstanceStatus } from "../../types";
import type { AuditState } from "./audit.schema";

const REQUIRED_FIELDS = [
  "focus",
  "currentProcess",
  "friction",
  "desiredOutcome",
  "name",
  "email",
] as const;

const OPTIONAL_FIELDS = ["businessName", "websiteUrl", "additionalContext"] as const;

export type RequiredAuditField = (typeof REQUIRED_FIELDS)[number];

export class AuditWorkflowProgressProjector implements IWorkflowProgressProjector<AuditState> {
  getProgress(state: AuditState, status: WorkflowInstanceStatus): WorkflowProgress {
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

  getMissingRequiredFields(state: AuditState): RequiredAuditField[] {
    return REQUIRED_FIELDS.filter((field) => !state[field]);
  }

  private getPhase(state: AuditState, status: WorkflowInstanceStatus): WorkflowProgress["phase"] {
    if (status !== "active") {
      return status;
    }

    if (state.confirmedRevision != null) {
      return "processing";
    }

    return state.preparedInteractionId ? "awaiting_confirmation" : "collecting";
  }
}
