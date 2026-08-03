import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { MeetingSlot, MeetingWorkflowPublicState } from "@/contracts/assistant.contract";
import {
  createEmptyMeetingWorkflowState,
  slotsMatch,
  type PendingMeetingBooking,
  type MeetingWorkflowState,
} from "./meeting-workflow.state";
import { meetingWorkflowStateSchema } from "./meeting-workflow.schema";
import type { IMeetingWorkflowService } from "../interfaces/meeting-workflow.service.interface";

export class MeetingWorkflowService implements IMeetingWorkflowService {
  constructor(private readonly getSigningSecret: () => string) {}

  decode(token: string | null | undefined): MeetingWorkflowState {
    if (!token) {
      return createEmptyMeetingWorkflowState();
    }

    const [iv, ciphertext, tag] = token.split(".");

    if (!iv || !ciphertext || !tag) {
      return createEmptyMeetingWorkflowState();
    }

    try {
      return meetingWorkflowStateSchema.parse(
        JSON.parse(this.decrypt(iv, ciphertext, tag)),
      );
    } catch {
      return createEmptyMeetingWorkflowState();
    }
  }

  encode(state: MeetingWorkflowState) {
    const iv = randomBytes(12);

    const cipher = createCipheriv("aes-256-gcm", this.key(), iv);

    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(meetingWorkflowStateSchema.parse(state)), "utf8"), cipher.final()]);

    return `${iv.toString("base64url")}.${ciphertext.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
  }

  publicState(state: MeetingWorkflowState): MeetingWorkflowPublicState {
    const { pendingBooking: _pendingBooking, ...publicState } = state;

    return publicState;
  }

  recordAvailability(
    state: MeetingWorkflowState,
    slots: MeetingSlot[],
    checkedAt: string,
  ): MeetingWorkflowState {
    return {
      ...state,
      availableSlots: slots,
      availabilityCheckedAt: checkedAt,
      selectedSlot: null,
      confirmed: false,
    };
  }

  prepare(
    state: MeetingWorkflowState,
    details: {
      name: string;
      email: string;
      timezone: string;
      reason: string;
      selectedSlot: MeetingSlot;
    },
  ): MeetingWorkflowState | null {
    if (!state.availableSlots.some((slot) => slotsMatch(slot, details.selectedSlot))) {
      return null;
    }

    return { ...state, ...details, selectedSlot: details.selectedSlot, confirmed: false };
  }

  recordConfirmation(state: MeetingWorkflowState, message: string): MeetingWorkflowState {
    if (!isComplete(state)) {
      return state;
    }

    const normalized = message.trim().toLowerCase().replace(/\s+/g, " ");

    if (["cancel", "cancel booking", "never mind", "no"].includes(normalized)) {
      return { ...state, confirmed: false };
    }

    if (["confirm", "book it", "yes, confirm", "confirm booking"].includes(normalized)) {
      return { ...state, confirmed: true };
    }

    return state;
  }

  reset(): MeetingWorkflowState {
    return createEmptyMeetingWorkflowState();
  }

  recordPendingBooking(state: MeetingWorkflowState, pendingBooking: PendingMeetingBooking): MeetingWorkflowState {
    return { ...state, pendingBooking };
  }

  private key() {
    return createHash("sha256").update(this.getSigningSecret()).digest();
  }

  private decrypt(iv: string, ciphertext: string, tag: string) {
    const decipher = createDecipheriv("aes-256-gcm", this.key(), Buffer.from(iv, "base64url"));

    decipher.setAuthTag(Buffer.from(tag, "base64url"));

    return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
  }
}

function isComplete(state: MeetingWorkflowState) {
  return Boolean(state.name && state.email && state.timezone && state.reason && state.selectedSlot);
}
