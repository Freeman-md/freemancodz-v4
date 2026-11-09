import { assistantChoiceSchema, type AssistantChoice } from "@/contracts/assistant-choice.contract";
import { askUserChoice } from "./implementations/ask-user-choice";

export type AssistantToolResult = {
  output: Record<string, unknown>;
  choice?: AssistantChoice;
};

export function executeGlobalAssistantTool(
  name: string,
  rawArguments: string,
): AssistantToolResult {
  let args: unknown;

  try {
    args = JSON.parse(rawArguments);
  } catch {
    return {
      output: { error: "invalid_json", message: "Tool arguments must be valid JSON." },
    };
  }

  if (name === "ask_user_choice") {
    const parsed = assistantChoiceSchema.safeParse(args);

    if (!parsed.success) {
      return invalidArguments();
    }

    return askUserChoice(parsed.data);
  }

  return {
    output: { error: "unknown_tool", message: "The requested tool is not available." },
  };
}

function invalidArguments(): AssistantToolResult {
  return {
    output: {
      error: "invalid_arguments",
      message: "Tool arguments did not match the required schema.",
    },
  };
}
