import { createElement, type ReactNode } from "react";
import type { ChatMessage } from "./models/chat-message";

export function isExternalUrl(url: string) {
  return /^https?:\/\//.test(url);
}
