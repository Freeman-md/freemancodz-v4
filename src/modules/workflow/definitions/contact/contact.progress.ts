import type { WorkflowProgress } from "@/contracts/workflow-progress.contract";
import type { WorkflowInstanceStatus } from "../../types";
import type { ContactState } from "./contact.schema";

const REQUIRED_FIELDS = ["name", "email", "message"] as const;

const OPTIONAL_FIELDS = ["businessName"] as const;

export function getContactProgress(
  state: ContactState,
  status: WorkflowInstanceStatus,
): WorkflowProgress {
  const missingRequiredFields = missingContactFields(state);

  return {
    phase: getPhase(state, status),
    fields: [
      ...REQUIRED_FIELDS.map((key) => ({ key, required: true, value: state[key] })),
      ...OPTIONAL_FIELDS.map((key) => ({ key, required: false, value: state[key] })),
    ],
    missingRequiredFields,
  };
}

export function missingContactFields(state: ContactState) {
  return REQUIRED_FIELDS.filter((field) => !state[field]);
}

function getPhase(state: ContactState, status: WorkflowInstanceStatus): WorkflowProgress["phase"] {
  if (status !== "active") {
    return status;
  }

  return state.preparedInteractionId ? "awaiting_confirmation" : "collecting";
}
