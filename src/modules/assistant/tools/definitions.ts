import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import { z } from "zod";
import { assistantPresentationSchema } from "@/contracts/assistant-ui.contract";

const { $schema: _schema, ...presentationParameters } = z.toJSONSchema(assistantPresentationSchema);

export const GLOBAL_ASSISTANT_TOOLS: OpenAIResponseTool[] = [
  {
    type: "function",
    name: "present_ui",
    strict: true,
    description:
      "Support a conversational question with inputs sharing one submit button. Normally collect one answer, or two closely related precise details; do not dump all missing fields into a form. Include a brief introduction acknowledging intent and explaining the next useful question. Prefer ordinary chat for goals/problems; TextArea is optional, not the default. OptionSelector is for genuine relevant choices, never invented visitor facts; ordinary chat remains available. No workflow is required: operation conversation with targetWorkflowId null collects ordinary visitor answers. InputField uses inputType text/email and null options; TextArea uses null inputType/options; OptionSelector uses null inputType and distinct labelled options. Use short noun labels. For workflow-owned answers use fields and only supplied permitted fields/control types, targetWorkflowId null. Never use conversation to bypass workflow permissions. For workflow_choice use field choice, OptionSelector, null inputType, continue/switch options and the requested targetWorkflowId. Explain that switch cancels the current request and starts the target; continue retains it. Presentation ends this response. Collection and continue never confirm sending, audit submission or booking.",
    parameters: presentationParameters,
  },
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
