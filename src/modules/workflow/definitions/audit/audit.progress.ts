import type { WorkflowProgress } from "@/contracts/workflow-progress.contract";
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

export function getAuditProgress(
  state: AuditState,
  status: WorkflowInstanceStatus,
): WorkflowProgress {
  const missingRequiredFields = missingAuditFields(state);

  return {
    phase: getPhase(state, status),
    fields: [
      ...REQUIRED_FIELDS.map((key) => ({ key, required: true, value: state[key] })),
      ...OPTIONAL_FIELDS.map((key) => ({ key, required: false, value: state[key] })),
    ],
    missingRequiredFields,
  };
}

export function missingAuditFields(state: AuditState): RequiredAuditField[] {
  return REQUIRED_FIELDS.filter((field) => !state[field]);
}

function getPhase(state: AuditState, status: WorkflowInstanceStatus): WorkflowProgress["phase"] {
  if (status !== "active") {
    return status;
  }

  return state.preparedInteractionId ? "awaiting_confirmation" : "collecting";
}
