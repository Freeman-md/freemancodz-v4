import { ChatSource } from "./application/types";

export type ChatStage = "launcher" | "composer" | "conversation";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  error?: boolean;
};
