import type { AssistantStreamEvent } from "@/contracts/assistant.contract";

export function encodeStreamEvent(event: AssistantStreamEvent) {
  return `${JSON.stringify(event)}\n`;
}
