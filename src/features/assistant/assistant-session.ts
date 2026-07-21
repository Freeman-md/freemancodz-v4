import type { ChatMessage, ChatSource, ChatStage } from "./types";

export function stageWhenOpening(messages: ChatMessage[]): ChatStage {
  return messages.length > 0 ? "conversation" : "composer";
}

export function appendAssistantDelta(messages: ChatMessage[], messageId: string, delta: string) {
  return messages.map((message) => message.id === messageId ? { ...message, content: message.content + delta } : message);
}

export function attachAssistantSources(messages: ChatMessage[], messageId: string, sources: ChatSource[]) {
  return messages.map((message) => message.id === messageId ? { ...message, sources } : message);
}

export function replaceAssistantWithError(messages: ChatMessage[], messageId: string, error: ChatMessage) {
  return messages.map((message) => message.id === messageId ? { ...error, id: messageId } : message);
}
