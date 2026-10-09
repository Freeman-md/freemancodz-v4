import type { AssistantChoice } from "@/contracts/assistant-choice.contract";

export function askUserChoice(choice: AssistantChoice) {
  return {
    output: { message: "The question will be shown. Wait for the visitor's reply.", ...choice },
    sources: [],
    choice,
  };
}
