import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { MeetingSlot, WorkflowPublicState } from "@/contracts/assistant.contract";
import { MEETING_CONFIG } from "@/server/modules/meeting/public";
import type { IWorkflowService } from "../interfaces/workflow.service.interface";
import { workflowStateSchema } from "../schemas/workflow.schema";
import {
  createEmptyWorkflowState,
  slotsMatch,
  type PendingMeetingBooking,
  type WorkflowState,
} from "../workflow.state";

export class WorkflowService implements IWorkflowService {
  constructor(private readonly getSigningSecret: () => string) {}

  decode(token: string | null | undefined): WorkflowState {
    if (!token) {
      return createEmptyWorkflowState();
    }

    const [iv, ciphertext, tag] = token.split(".");

    if (!iv || !ciphertext || !tag) {
      return createEmptyWorkflowState();
    }

    try {
      return this.normalize(workflowStateSchema.parse(JSON.parse(this.decrypt(iv, ciphertext, tag))));
    } catch {
      return createEmptyWorkflowState();
    }
  }

  encode(state: WorkflowState) {
    const iv = randomBytes(12);

    const cipher = createCipheriv("aes-256-gcm", this.key(), iv);

    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(workflowStateSchema.parse(this.normalize(state))), "utf8"),
      cipher.final(),
    ]);

    return `${iv.toString("base64url")}.${ciphertext.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
  }

  publicState(state: WorkflowState): WorkflowPublicState {
    const { pendingBooking: _pendingBooking, ...publicState } = this.normalize(state);

    return publicState;
  }

  recordAvailability(state: WorkflowState, slots: MeetingSlot[], checkedAt: string): WorkflowState {
    return {
      ...this.normalize(state),
      timezone: MEETING_CONFIG.timezone,
      availableSlots: slots.map((slot) => ({ ...slot, timezone: MEETING_CONFIG.timezone })),
      availabilityCheckedAt: checkedAt,
      selectedSlot: null,
      confirmed: false,
    };
  }

  prepare(
    state: WorkflowState,
    details: {
      name: string;
      email: string;
      reason: string;
      selectedSlot: Pick<MeetingSlot, "start" | "end">;
    },
  ): WorkflowState | null {
    const selectedSlot = state.availableSlots.find((slot) => slotsMatch(slot, details.selectedSlot));

    if (!selectedSlot) {
      return null;
    }

    return {
      ...this.normalize(state),
      ...details,
      timezone: MEETING_CONFIG.timezone,
      selectedSlot: { ...selectedSlot, timezone: MEETING_CONFIG.timezone },
      confirmed: false,
    };
  }

  recordConfirmation(state: WorkflowState, message: string): WorkflowState {
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

  reset(): WorkflowState {
    return createEmptyWorkflowState();
  }

  recordPendingBooking(state: WorkflowState, pendingBooking: PendingMeetingBooking): WorkflowState {
    return {
      ...this.normalize(state),
      pendingBooking: {
        ...pendingBooking,
        timezone: MEETING_CONFIG.timezone,
        selectedSlot: { ...pendingBooking.selectedSlot, timezone: MEETING_CONFIG.timezone },
      },
    };
  }

  private normalize(state: WorkflowState): WorkflowState {
    return {
      ...state,
      timezone: MEETING_CONFIG.timezone,
      availableSlots: state.availableSlots.map((slot) => ({
        ...slot,
        timezone: MEETING_CONFIG.timezone,
      })),
      selectedSlot: state.selectedSlot
        ? { ...state.selectedSlot, timezone: MEETING_CONFIG.timezone }
        : null,
      pendingBooking: state.pendingBooking
        ? {
            ...state.pendingBooking,
            timezone: MEETING_CONFIG.timezone,
            selectedSlot: {
              ...state.pendingBooking.selectedSlot,
              timezone: MEETING_CONFIG.timezone,
            },
          }
        : null,
    };
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

function isComplete(state: WorkflowState) {
  return Boolean(state.name && state.email && state.reason && state.selectedSlot);
}
