import type { OpenAIResponseTool } from "@/infrastructure/openai/models/openai-response-request";

export const GLOBAL_ASSISTANT_TOOLS: OpenAIResponseTool[] = [
  {
    type: "function",
    name: "search_website",
    description:
      "Search Freeman's portfolio for factual information needed to answer a portfolio question.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["query"],
      properties: { query: { type: "string", description: "A clear portfolio search query." } },
    },
  },
];
