import type { WorkflowProgress } from "@/contracts/workflow-progress.contract";
import type { WorkflowInstanceStatus } from "../../types";
import type { MeetingBookingState } from "./meeting-booking.schema";

const REQUIRED_FIELDS = ["name", "email", "reason", "selectedSlot"] as const;

export function getMeetingBookingProgress(
  state: MeetingBookingState,
  status: WorkflowInstanceStatus,
): WorkflowProgress {
  return {
    phase: getPhase(state, status),
    fields: REQUIRED_FIELDS.map((key) => ({ key, required: true, value: state[key] })),
    missingRequiredFields: REQUIRED_FIELDS.filter((field) => !state[field]),
  };
}

function getPhase(
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
