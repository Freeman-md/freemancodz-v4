import type { ActiveWorkflow } from "@/contracts/assistant.contract";
import type { IWorkflowDefinition, WorkflowTool } from "../../types";
import { type MeetingState, meetingStateSchema } from "./schema";
import { formatMeetingSlot, type MeetingAvailability } from "./tool-handlers";
import {
  createFindMeetingSlotsTool,
  createSelectMeetingSlotTool,
  saveMeetingTopicTool,
} from "./tools";

export class MeetingBookingWorkflowDefinition implements IWorkflowDefinition<MeetingState> {
  readonly id = "meeting-booking";

  readonly version: number = 1;

  readonly title: string = "Book a meeting";

  readonly description = "Book a meeting with Freeman.";

  readonly stateSchema = meetingStateSchema;

  private readonly findSlotsTool: WorkflowTool;

  constructor(private readonly availability: MeetingAvailability) {
    this.findSlotsTool = createFindMeetingSlotsTool(availability);
  }

  createInitialState(): MeetingState {
    return { reason: null, availableSlots: [], selectedSlot: null };
  }

  getProgress(savedState: unknown): Pick<ActiveWorkflow, "phase" | "details"> {
    const { reason, selectedSlot } = this.stateSchema.parse(savedState);

    return {
      phase: "collecting",
      details: [
        { key: "reason", label: "Topic", value: reason },
        {
          key: "time",
          label: "Time",
          value: selectedSlot ? formatMeetingSlot(selectedSlot) : null,
        },
      ],
    };
  }

  getTools(savedState: unknown): readonly WorkflowTool[] {
    const { reason, availableSlots, selectedSlot } = this.stateSchema.parse(savedState);

    if (reason === null) {
      return [saveMeetingTopicTool];
    }

    if (selectedSlot) {
      return [];
    }

    return availableSlots.length > 0
      ? [this.findSlotsTool, createSelectMeetingSlotTool(this.availability, availableSlots)]
      : [this.findSlotsTool];
  }
}
