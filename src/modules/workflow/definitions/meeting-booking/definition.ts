import type { MeetingAvailability } from "@/modules/meeting/types";
import type { ActiveWorkflow } from "@/contracts/assistant.contract";
import type {
  IWorkflowDefinition,
  WorkflowAction,
  WorkflowReview,
  WorkflowTool,
} from "../../types";
import { type MeetingState, meetingBookingPayloadSchema, meetingStateSchema } from "./schema";
import { formatMeetingSlot } from "./tool-handlers";
import {
  createFindMeetingSlotsTool,
  createSelectMeetingSlotTool,
  saveMeetingTopicTool,
  saveMeetingIdentityTool,
} from "./tools";

export class MeetingBookingWorkflowDefinition implements IWorkflowDefinition<MeetingState> {
  readonly id = "meeting-booking";

  readonly version: number = 1;

  readonly title: string = "Book a meeting";

  readonly description = "Book a meeting with Freeman.";

  readonly stateSchema = meetingStateSchema;

  constructor(
    private readonly availability: MeetingAvailability,
    private readonly booking?: WorkflowAction,
  ) {}

  createInitialState(): MeetingState {
    return this.stateSchema.parse({});
  }

  getProgress(savedState: unknown): Pick<ActiveWorkflow, "phase" | "details"> {
    const { name, email, reason, selectedSlot } = this.stateSchema.parse(savedState);

    return {
      phase: "collecting",
      details: [
        { key: "name", label: "Name", value: name },
        { key: "email", label: "Email", value: email },
        { key: "reason", label: "Topic", value: reason },
        {
          key: "time",
          label: "Time",
          value: selectedSlot ? formatMeetingSlot(selectedSlot) : null,
        },
      ],
    };
  }

  getGuidance(savedState: unknown): string {
    const { name, email, reason, selectedSlot } = this.stateSchema.parse(savedState);

    const missing = [
      name ? null : "name",
      email ? null : "email address",
      reason ? null : "topic",
      selectedSlot ? null : "time",
    ].filter(Boolean);

    return missing.length
      ? `The meeting request still needs: ${missing.join(", ")}. Act on details the visitor offers and ask only for missing details. If they ask for availability, check it without waiting for their name, email or topic. When they leave the dates to you, check the next seven days. A saved time is a preference.`
      : "The meeting details are complete. Let the visitor review them or correct a detail.";
  }

  getReview(savedState: unknown): WorkflowReview | null {
    const { name, email, reason, selectedSlot } = this.stateSchema.parse(savedState);

    const parsed = meetingBookingPayloadSchema.safeParse({
      name,
      email,
      reason,
      slot: selectedSlot,
    });

    if (!parsed.success || !this.booking) {
      return null;
    }

    return {
      actionKey: "book-meeting",
      label: "Confirm booking",
      rows: [
        { key: "name", label: "Name", value: parsed.data.name },
        { key: "email", label: "Email", value: parsed.data.email },
        { key: "reason", label: "Topic", value: parsed.data.reason },
        { key: "time", label: "Time", value: formatMeetingSlot(parsed.data.slot) },
      ],
      payload: parsed.data,
    };
  }

  getAction(key: string) {
    return key === "book-meeting" ? this.booking : undefined;
  }

  getTools(savedState: unknown): readonly WorkflowTool[] {
    const { availableSlots } = this.stateSchema.parse(savedState);

    return [
      saveMeetingTopicTool,
      createFindMeetingSlotsTool(this.availability),
      ...(availableSlots.length
        ? [createSelectMeetingSlotTool(this.availability, availableSlots)]
        : []),
      saveMeetingIdentityTool,
    ];
  }
}
