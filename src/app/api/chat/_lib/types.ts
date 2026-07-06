export type ChatRequestBody = {
  message?: unknown;
  previousResponseId?: unknown;
};

export type ChatStreamSource = {
  id: string;
  title: string;
  url: string;
};

export type ChatStreamEvent =
  | { type: "sources"; sources: ChatStreamSource[] }
  | { type: "response_id"; responseId: string }
  | { type: "delta"; delta: string }
  | { type: "done" }
  | { type: "error"; error: string };

export type ContextChunk = {
  id: string;
  title: string;
  category: string;
  url: string;
  keywords: string[];
  content: string;
};
