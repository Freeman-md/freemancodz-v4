export type ChatStage = "launcher" | "composer" | "conversation";

export type ChatSource = {
  id: string;
  title: string;
  url: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  error?: boolean;
};
