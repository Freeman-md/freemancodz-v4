import type { WorkflowTool } from "../../types";
import { saveMeetingTopic } from "./tool-handlers";

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
