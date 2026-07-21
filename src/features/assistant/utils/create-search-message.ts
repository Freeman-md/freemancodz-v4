import { ChatMessage } from "../types";

export function createUserMessage(content: string): ChatMessage {
  return {
    id: `user-${Date.now()}`,
    role: "user",
    content,
  };
}

export function createAssistantMessage(content: string, sources: ChatMessage["sources"] = []): ChatMessage {
  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content,
    sources,
  };
}

export function createAssistantErrorMessage(
  content = "I couldn’t complete that request right now. Please try again.",
): ChatMessage {
  return {
    id: `assistant-error-${Date.now()}`,
    role: "assistant",
    content,
    error: true,
  };
}