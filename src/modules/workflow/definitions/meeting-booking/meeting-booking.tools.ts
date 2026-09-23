import type { OpenAIResponseTool } from "@/infrastructure/openai/models/openai-response-request";

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

export const CONFIRM_MEETING_TOOL: OpenAIResponseTool = {
  type: "function",
  name: "confirm_meeting",
  description:
    "Record the visitor's explicit confirmation of the prepared summary. Call only after a subsequent user message clearly confirms the booking.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: [],
    properties: {},
  },
};

export const BOOK_MEETING_TOOL: OpenAIResponseTool = {
  type: "function",
  name: "book_meeting",
  description:
    "Create the real meeting after the prepared summary has been explicitly confirmed, or retry its pending database reconciliation.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: [],
    properties: {},
  },
};
