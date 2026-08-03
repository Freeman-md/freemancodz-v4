import type { FunctionTool } from "openai/resources/responses/responses";

export const ASSISTANT_TOOLS: FunctionTool[] = [
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
    description: "Find deterministic dummy meeting slots when a visitor wants to schedule a meeting.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["dateRange", "durationMinutes", "timezone"],
      properties: {
        dateRange: { type: "string" },
        durationMinutes: { type: "integer" },
        timezone: { type: "string" },
      },
    },
  },
  {
    type: "function",
    name: "prepare_meeting",
    description: "Prepare a deterministic dummy meeting summary before requesting booking confirmation.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["title", "slotId", "attendeeName"],
      properties: {
        title: { type: "string" },
        slotId: { type: "string" },
        attendeeName: { type: "string" },
      },
    },
  },
  {
    type: "function",
    name: "book_meeting",
    description: "Return a deterministic dummy booking result only after the visitor has confirmed the prepared meeting.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["title", "slotId", "attendeeName", "confirmed"],
      properties: {
        title: { type: "string" },
        slotId: { type: "string" },
        attendeeName: { type: "string" },
        confirmed: { type: "boolean", const: true },
      },
    },
  },
];
