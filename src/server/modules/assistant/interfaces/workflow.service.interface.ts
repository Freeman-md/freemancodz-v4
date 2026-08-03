import type { MeetingSlot, WorkflowPublicState } from "@/contracts/assistant.contract";
import type { PendingMeetingBooking, WorkflowState } from "../workflow.state";

export interface IWorkflowService {
  decode(token: string | null | undefined): WorkflowState;
  encode(state: WorkflowState): string;
  publicState(state: WorkflowState): WorkflowPublicState;
  recordAvailability(state: WorkflowState, slots: MeetingSlot[], checkedAt: string): WorkflowState;
  prepare(
    state: WorkflowState,
    details: {
      name: string;
      email: string;
      reason: string;
      selectedSlot: Pick<MeetingSlot, "start" | "end">;
    },
  ): WorkflowState | null;
  recordConfirmation(state: WorkflowState, message: string): WorkflowState;
  recordPendingBooking(state: WorkflowState, pendingBooking: PendingMeetingBooking): WorkflowState;
  reset(): WorkflowState;
}
