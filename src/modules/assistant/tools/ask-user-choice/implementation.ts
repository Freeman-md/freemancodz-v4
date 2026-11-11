import { askUserChoiceArgumentsSchema } from "./schema";

export function askUserChoice(rawArguments: string) {
  return askUserChoiceArgumentsSchema.parse(JSON.parse(rawArguments));
}
