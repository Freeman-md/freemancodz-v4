import { z } from "zod";
import type { OpenAIResponseTool } from "@/infrastructure/openai/types";

export const requestDraftDiscardArgumentsSchema = z.strictObject({});

const { $schema: _schema, ...parameters } = z.toJSONSchema(requestDraftDiscardArgumentsSchema);

export const REQUEST_DRAFT_DISCARD_TOOL = {
  type: "function",
  name: "request_workflow_draft_discard",
  description:
    "Show the discard confirmation when the visitor asks to cancel or discard the current unapproved draft. " +
    "The visitor must use the confirmation control to discard it.",
  strict: true,
  parameters: { ...parameters, required: [] },
} satisfies OpenAIResponseTool;
