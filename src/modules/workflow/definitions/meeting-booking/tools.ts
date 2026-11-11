import type { MeetingAvailability, MeetingSlot } from "@/modules/meeting/types";
import { getLondonDate } from "@/modules/meeting/time";
import type { WorkflowTool } from "../../types";
import {
  findMeetingSlots,
  formatMeetingSlot,
  saveMeetingTopic,
  saveMeetingIdentity,
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

export const saveMeetingIdentityTool: WorkflowTool = {
  tool: {
    type: "function",
    name: "save_meeting_identity",
    description:
      "Save the name or email the visitor gave for this meeting. Use null for a field the visitor did not supply.",
    strict: true,
    parameters: {
      type: "object",
      properties: { name: { type: ["string", "null"] }, email: { type: ["string", "null"] } },
      required: ["name", "email"],
      additionalProperties: false,
    },
  },
  apply: saveMeetingIdentity,
};

export function createFindMeetingSlotsTool(availability: MeetingAvailability): WorkflowTool {
  return {
    tool: {
      type: "function",
      name: "find_meeting_slots",
      description:
        `Today in London is ${getLondonDate(new Date())}. Find free times for the requested dates. ` +
        "For the next seven days or an open-ended request for availability, pass null for both dates and preferredTime. " +
        "For a specific day without a time, use that date for both dates. " +
        "For a specific time, use preferredTime with the visitor's local date, time and IANA timezone or explicit UTC offset. " +
        "If the timezone is missing, ask whether they mean London time before calling. " +
        "If requestedTimeAvailable is false, explain the requested time is unavailable and offer only returned alternatives. " +
        "Only use returned slot labels. If Calendar is unavailable, report the outage and offer to retry. " +
        "If the lookup succeeded with no slots, ask for different dates.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          startDate: {
            type: ["string", "null"],
            description: "First London date, YYYY-MM-DD, or null",
          },
          endDate: {
            type: ["string", "null"],
            description: "Last London date, YYYY-MM-DD, or null",
          },
          preferredTime: {
            type: ["object", "null"],
            properties: {
              date: { type: "string", description: "Visitor's local date, YYYY-MM-DD" },
              time: { type: "string", description: "Visitor's local time, HH:mm" },
              timeZone: {
                type: "string",
                description: "IANA timezone or UTC offset, for example Europe/London or +05:30",
              },
            },
            required: ["date", "time", "timeZone"],
            additionalProperties: false,
          },
        },
        required: ["startDate", "endDate", "preferredTime"],
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
