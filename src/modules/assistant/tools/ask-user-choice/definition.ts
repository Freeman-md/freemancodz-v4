import { z } from "zod";

import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import { askUserChoiceArgumentsSchema } from "./schema";

const { $schema: _schema, ...parameters } = z.toJSONSchema(askUserChoiceArgumentsSchema);

export const ASK_USER_CHOICE_TOOL = {
  type: "function",
  name: "ask_user_choice",
  description:
    "Suggest two to four short replies when they would help clarify what the visitor wants. " +
    "Write each option as something the visitor could say. Call before writing the question.",
  strict: true,
  parameters,
} satisfies OpenAIResponseTool;
