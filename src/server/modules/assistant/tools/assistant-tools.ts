import type { OpenAIResponseTool } from "@/server/infrastructure/openai/models/openai-response-request";

export const ASSISTANT_TOOLS: OpenAIResponseTool[] = [
  {
    type: "function",
    name: "search_website",
    description: "Search Freeman's portfolio for factual information needed to answer a portfolio question.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["query"],
      properties: { query: { type: "string", description: "A clear portfolio search query." } },
    },
  },
  {
    type: "function",
    name: "find_meeting_slots",
    description: "Find genuine available meeting slots for a visitor's requested future date range.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["startDate", "endDate", "timezone"],
      properties: {
        startDate: { type: "string", description: "The first requested date, YYYY-MM-DD." },
        endDate: { type: "string", description: "The final requested date, YYYY-MM-DD." },
        timezone: { type: "string" },
      },
    },
  },
  {
    type: "function",
    name: "prepare_meeting",
    description: "Prepare the complete real booking summary for one of the latest returned slots. This never books a meeting.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["name", "email", "timezone", "reason", "selectedSlot"],
      properties: {
        name: { type: "string" }, email: { type: "string" }, timezone: { type: "string" }, reason: { type: "string" },
        selectedSlot: { type: "object", additionalProperties: false, required: ["start", "end", "timezone"], properties: { start: { type: "string" }, end: { type: "string" }, timezone: { type: "string" } } },
      },
    },
  },
  {
    type: "function",
    name: "book_meeting",
    description: "Book the currently prepared meeting only after the visitor explicitly confirmed it. Never call this before a clear confirmation message.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      required: [], properties: {},
    },
  },
];
