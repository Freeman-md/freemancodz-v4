import type { AssistantSource } from "@/contracts/assistant.contract";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: AssistantSource[];
  error?: boolean;
};
