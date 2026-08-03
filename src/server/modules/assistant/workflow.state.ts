import type { MeetingSlot, WorkflowPublicState } from "@/contracts/assistant.contract";
import { MEETING_CONFIG } from "@/server/modules/meeting/public";

export type PendingMeetingBooking = {
  googleEventId: string;
  googleEventUrl: string | null;
  rawProviderPayload: Record<string, unknown>;
  name: string;
  email: string;
  timezone: string;
  reason: string;
  selectedSlot: MeetingSlot;
};

export type WorkflowState = WorkflowPublicState & {
  pendingBooking: PendingMeetingBooking | null;
};

export function createEmptyWorkflowState(): WorkflowState {
  return {
    name: null,
    email: null,
    timezone: MEETING_CONFIG.timezone,
    reason: null,
    availableSlots: [],
    availabilityCheckedAt: null,
    selectedSlot: null,
    confirmed: false,
    pendingBooking: null,
  };
}

export function slotsMatch(
  left: Pick<MeetingSlot, "start" | "end">,
  right: Pick<MeetingSlot, "start" | "end">,
) {
  return left.start === right.start && left.end === right.end;
}
