import type { OpenAIResponseTool } from "@/infrastructure/openai/types";

export const FIND_MEETING_SLOTS_TOOL: OpenAIResponseTool = {
  type: "function",
  name: "find_meeting_slots",
  description: "Find genuine available meeting slots for a requested future date range.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["startDate", "endDate"],
    properties: {
      startDate: { type: "string", description: "The first requested date, YYYY-MM-DD." },
      endDate: { type: "string", description: "The final requested date, YYYY-MM-DD." },
    },
  },
};

export const PREPARE_MEETING_TOOL: OpenAIResponseTool = {
  type: "function",
  name: "prepare_meeting",
  description:
    "Prepare a complete booking summary for one of the latest returned slots. This never books a meeting.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["name", "email", "reason", "selectedSlot"],
    properties: {
      name: { type: "string" },
      email: { type: "string" },
      reason: { type: "string" },
      selectedSlot: {
        type: "object",
        additionalProperties: false,
        required: ["start", "end"],
        properties: {
          start: { type: "string" },
          end: { type: "string" },
        },
      },
    },
  },
};
