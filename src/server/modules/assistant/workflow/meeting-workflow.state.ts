import type { MeetingSlot, MeetingWorkflowPublicState } from "@/contracts/assistant.contract";

export type PendingMeetingBooking = {
  googleEventId: string;
  googleEventUrl: string | null;
  rawProviderPayload: Record<string, unknown>;
};

export type MeetingWorkflowState = MeetingWorkflowPublicState & { pendingBooking: PendingMeetingBooking | null };

export function createEmptyMeetingWorkflowState(): MeetingWorkflowState {
  return {
    name: null,
    email: null,
    timezone: null,
    reason: null,
    availableSlots: [],
    availabilityCheckedAt: null,
    selectedSlot: null,
    confirmed: false,
    pendingBooking: null,
  };
}

export function slotsMatch(left: MeetingSlot, right: MeetingSlot) {
  return left.start === right.start && left.end === right.end && left.timezone === right.timezone;
}
