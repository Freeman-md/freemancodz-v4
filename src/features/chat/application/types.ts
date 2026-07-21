import type { Database } from "@/types/supabase";

export type MatchSiteChunksRow =
  Database["public"]["Functions"]["match_site_chunks"]["Returns"][number];

export type ChatSource = {
  id: string;
  title: string;
  url: string;
};

export type ChatStreamEvent =
  | { type: "sources"; sources: ChatSource[] }
  | { type: "response_id"; responseId: string }
  | { type: "delta"; delta: string }
  | { type: "done" }
  | { type: "error"; error: string };

export type StreamChatResponseHandlers = {
  onDelta: (delta: string) => void;
  onResponseId: (responseId: string) => void;
  onSources: (sources: ChatSource[]) => void;
};