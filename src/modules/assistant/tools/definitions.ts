import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import { z } from "zod";
import { assistantChoiceSchema } from "@/contracts/assistant-choice.contract";

const { $schema: _schema, ...choiceParameters } = z.toJSONSchema(assistantChoiceSchema);

export const GLOBAL_ASSISTANT_TOOLS: OpenAIResponseTool[] = [
  {
    type: "function",
    name: "ask_user_choice",
    strict: true,
    description:
      "Ask a question with two to six distinct, meaningful reply options when a choice helps the conversation. Write both the question and options naturally. Each option must stand alone as a visitor reply and explain what choosing it means; use no hidden commands or identifiers. Asking never updates a workflow or confirms an action. The visitor can write their own reply instead. This ends tool execution for the turn: wait for the visitor before taking further action.",
    parameters: choiceParameters,
  },
];

export const PORTFOLIO_SEARCH_TOOL: OpenAIResponseTool = {
  type: "function",
  name: "search_portfolio",
  description:
    "Retrieve factual excerpts from the published portfolio. Use a standalone query resolving any references from prior turns. Call before answering a portfolio question.",
  strict: true,
  parameters: {
    type: "object",
    properties: { query: { type: "string", description: "A short standalone search query." } },
    required: ["query"],
    additionalProperties: false,
  },
};
