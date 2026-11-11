import { ASK_USER_CHOICE_TOOL } from "./ask-user-choice/definition";
import { askUserChoice } from "./ask-user-choice/implementation";

export function executeTool(name: string, rawArguments: string) {
  if (name === ASK_USER_CHOICE_TOOL.name) {
    return askUserChoice(rawArguments);
  }

  throw new Error("Unsupported assistant tool.");
}
