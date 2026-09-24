import type {
  AssistantSource,
  WorkflowPublicInstance,
} from "@/contracts/assistant.contract";

export type ChatSource = AssistantSource;

export type StreamChatResponseHandlers = {
  onDelta: (delta: string) => void;
  onResponseId: (responseId: string) => void;
  onWorkflow: (instance: WorkflowPublicInstance) => void;
  onSources: (sources: ChatSource[]) => void;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  error?: boolean;
};
