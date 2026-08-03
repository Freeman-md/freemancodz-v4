import type { MeetingSlot, MeetingWorkflowPublicState } from "@/contracts/assistant.contract";
import type { MeetingWorkflowState, PendingMeetingBooking } from "../workflow/meeting-workflow.state";

export interface IMeetingWorkflowService {
  decode(token: string | null | undefined): MeetingWorkflowState;
  encode(state: MeetingWorkflowState): string;
  publicState(state: MeetingWorkflowState): MeetingWorkflowPublicState;
  recordAvailability(state: MeetingWorkflowState, slots: MeetingSlot[], checkedAt: string): MeetingWorkflowState;
  prepare(state: MeetingWorkflowState, details: { name: string; email: string; timezone: string; reason: string; selectedSlot: MeetingSlot }): MeetingWorkflowState | null;
  recordConfirmation(state: MeetingWorkflowState, message: string): MeetingWorkflowState;
  recordPendingBooking(state: MeetingWorkflowState, pendingBooking: PendingMeetingBooking): MeetingWorkflowState;
  reset(): MeetingWorkflowState;
}
