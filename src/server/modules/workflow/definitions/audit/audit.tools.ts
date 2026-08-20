import type { OpenAIResponseTool } from "@/server/infrastructure/openai/models/openai-response-request";

const AUDIT_FIELDS = [
  "focus",
  "currentProcess",
  "friction",
  "desiredOutcome",
  "name",
  "email",
  "businessName",
  "websiteUrl",
  "additionalContext",
] as const;

export const UPDATE_AUDIT_CONTEXT_TOOL: OpenAIResponseTool = {
  type: "function",
  name: "update_audit_context",
  description:
    "Save every audit detail supplied by the visitor in this message. Include multiple updates in one call. Use null only to clear an optional detail.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["updates"],
    properties: {
      updates: {
        type: "array",
        minItems: 1,
        maxItems: 9,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "value"],
          properties: {
            field: { type: "string", enum: AUDIT_FIELDS },
            value: { anyOf: [{ type: "string" }, { type: "null" }] },
          },
        },
      },
    },
  },
};

export const PREPARE_AUDIT_SUBMISSION_TOOL: OpenAIResponseTool = {
  type: "function",
  name: "prepare_audit_submission",
  description:
    "Prepare a concise summary after every required audit detail is known. This creates no request.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: [],
    properties: {},
  },
};

export const SUBMIT_AUDIT_TOOL: OpenAIResponseTool = {
  type: "function",
  name: "submit_audit",
  description:
    "Submit the prepared audit only after the visitor explicitly confirms that exact summary in a later message.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    required: [],
    properties: {},
  },
};
