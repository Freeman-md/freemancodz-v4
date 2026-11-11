import type { MeetingSlot } from "@/modules/meeting/types";
import type { WorkflowTool } from "../../types";
import {
  findMeetingSlots,
  formatMeetingSlot,
  type MeetingAvailability,
  saveMeetingTopic,
  selectMeetingSlot,
} from "./tool-handlers";

export const saveMeetingTopicTool: WorkflowTool = {
  tool: {
    type: "function",
    name: "save_meeting_topic",
    description:
      "Save the topic the visitor gave for this meeting. Use their stated reason. " +
      "For unrelated questions, continue the conversation without saving a topic.",
    strict: true,
    parameters: {
      type: "object",
      properties: { reason: { type: "string" } },
      required: ["reason"],
      additionalProperties: false,
    },
  },
  apply: saveMeetingTopic,
};

export function createFindMeetingSlotsTool(availability: MeetingAvailability): WorkflowTool {
  return {
    tool: {
      type: "function",
      name: "find_meeting_slots",
      description:
        "Find free meeting times for the visitor's requested dates in London time. " +
        "Show only the returned labels and ask the visitor to choose one. " +
        "If no times are returned, ask for other dates. If Calendar is unavailable, say so.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "First date, YYYY-MM-DD" },
          endDate: { type: "string", description: "Last date, YYYY-MM-DD" },
        },
        required: ["startDate", "endDate"],
        additionalProperties: false,
      },
    },
    apply: (state, args) => findMeetingSlots(availability, state, args),
  };
}

export function createSelectMeetingSlotTool(
  availability: MeetingAvailability,
  availableSlots: readonly MeetingSlot[],
): WorkflowTool {
  const offeredTimes = availableSlots.map((slot) => formatMeetingSlot(slot) + " = " + slot.start);

  return {
    tool: {
      type: "function",
      name: "select_meeting_slot",
      description:
        "Save a time only when the visitor clearly selects one of the latest offered slots. " +
        "Pass the exact start value returned for that time. Ask if the choice is ambiguous. " +
        "Confirm a selected time as a preference. A selection does not book a meeting. " +
        "If the slot is unavailable or was not offered, ask the visitor to check availability again. " +
        "Current offered times: " +
        offeredTimes.join("; "),
      strict: true,
      parameters: {
        type: "object",
        properties: { start: { type: "string", enum: availableSlots.map(({ start }) => start) } },
        required: ["start"],
        additionalProperties: false,
      },
    },
    apply: (state, args) => selectMeetingSlot(availability, state, args),
  };
}
