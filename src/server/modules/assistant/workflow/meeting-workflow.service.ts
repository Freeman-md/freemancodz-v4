import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { MeetingSlot, MeetingWorkflowPublicState } from "@/contracts/assistant.contract";
import { createEmptyMeetingWorkflowState, slotsMatch, type MeetingWorkflowState } from "./meeting-workflow.state";
import { meetingWorkflowStateSchema } from "./meeting-workflow.schema";

export class MeetingWorkflowService {
  constructor(private readonly getSigningSecret: () => string) {}

  decode(token: string | null | undefined): MeetingWorkflowState {
    if (!token) {return createEmptyMeetingWorkflowState();}

    const [encoded, signature] = token.split(".");

    if (!encoded || !signature || !this.isValidSignature(encoded, signature)) {return createEmptyMeetingWorkflowState();}

    try {
      return meetingWorkflowStateSchema.parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
    } catch {
      return createEmptyMeetingWorkflowState();
    }
  }

  encode(state: MeetingWorkflowState) {
    const encoded = Buffer.from(JSON.stringify(meetingWorkflowStateSchema.parse(state))).toString("base64url");

    return `${encoded}.${this.sign(encoded)}`;
  }

  publicState(state: MeetingWorkflowState): MeetingWorkflowPublicState { return state; }

  recordAvailability(state: MeetingWorkflowState, slots: MeetingSlot[], checkedAt: string): MeetingWorkflowState {
    return { ...state, availableSlots: slots, availabilityCheckedAt: checkedAt, selectedSlot: null, confirmed: false };
  }

  prepare(state: MeetingWorkflowState, details: { name: string; email: string; timezone: string; reason: string; selectedSlot: MeetingSlot }): MeetingWorkflowState | null {
    if (!state.availableSlots.some((slot) => slotsMatch(slot, details.selectedSlot))) {return null;}

    return { ...state, ...details, selectedSlot: details.selectedSlot, confirmed: false };
  }

  recordConfirmation(state: MeetingWorkflowState, message: string): MeetingWorkflowState {
    if (!isComplete(state)) {return state;}

    const normalized = message.trim().toLowerCase().replace(/\s+/g, " ");

    if (["cancel", "cancel booking", "never mind", "no"].includes(normalized)) {return { ...state, confirmed: false };}

    if (["confirm", "book it", "yes, confirm", "confirm booking"].includes(normalized)) {return { ...state, confirmed: true };}

    return state;
  }

  reset(): MeetingWorkflowState { return createEmptyMeetingWorkflowState(); }

  private sign(value: string) { return createHmac("sha256", this.getSigningSecret()).update(value).digest("base64url"); }

  private isValidSignature(value: string, signature: string) {
    const expected = this.sign(value);

    return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}

function isComplete(state: MeetingWorkflowState) {
  return Boolean(state.name && state.email && state.timezone && state.reason && state.selectedSlot);
}
