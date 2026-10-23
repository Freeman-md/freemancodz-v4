import type { OpenAIResponseTool } from "@/infrastructure/openai/types";

const CONTACT_FIELDS = ["name", "email", "message", "businessName"] as const;

export const UPDATE_CONTACT_CONTEXT_TOOL: OpenAIResponseTool = {
  type: "function",
  name: "update_contact_context",
  description:
    "Save every contact detail supplied by the visitor in this message. Include multiple updates in one call. Use null only to clear the optional business name.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["updates"],
    properties: {
      updates: {
        type: "array",
        minItems: 1,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "value"],
          properties: {
            field: { type: "string", enum: CONTACT_FIELDS },
            value: { anyOf: [{ type: "string" }, { type: "null" }] },
          },
        },
      },
    },
  },
};

export const PREPARE_CONTACT_SUBMISSION_TOOL: OpenAIResponseTool = {
  type: "function",
  name: "prepare_contact_submission",
  description: "Prepare a concise summary after every required contact detail is known.",
  strict: true,
  parameters: { type: "object", additionalProperties: false, required: [], properties: {} },
};
