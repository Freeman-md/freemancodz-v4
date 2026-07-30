import type { AssistantSource, AssistantStreamEvent } from "@/contracts/assistant.contract";

export type MatchSiteChunksRow = {
  id: string;
  title: string;
  url: string;
  content: string;
  category: string;
  keywords: string[];
  similarity: number;
};

export type ChatSource = AssistantSource;
export type ChatStreamEvent = AssistantStreamEvent;

export type StreamChatResponseHandlers = {
  onDelta: (delta: string) => void;
  onResponseId: (responseId: string) => void;
  onSources: (sources: ChatSource[]) => void;
};

export type ChatStage = "launcher" | "composer" | "conversation";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  error?: boolean;
};
