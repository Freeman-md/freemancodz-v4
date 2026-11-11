import type { ActiveWorkflow } from "@/contracts/assistant.contract";
import type { IWorkflowDefinition, WorkflowTool } from "../../types";
import { type MeetingState, meetingStateSchema } from "./schema";
import { saveMeetingTopicTool } from "./tools";

export class MeetingBookingWorkflowDefinition implements IWorkflowDefinition<MeetingState> {
  readonly id = "meeting-booking";

  readonly version: number = 1;

  readonly title: string = "Book a meeting";

  readonly description = "Book a meeting with Freeman.";

  readonly stateSchema = meetingStateSchema;

  createInitialState(): MeetingState {
    return { reason: null };
  }

  getProgress(savedState: unknown): Pick<ActiveWorkflow, "phase" | "details"> {
    const { reason } = this.stateSchema.parse(savedState);

    return {
      phase: "collecting",
      details: [{ key: "reason", label: "Topic", value: reason }],
    };
  }

  getTools(savedState: unknown): readonly WorkflowTool[] {
    const { reason } = this.stateSchema.parse(savedState);

    return reason === null ? [saveMeetingTopicTool] : [];
  }
}
