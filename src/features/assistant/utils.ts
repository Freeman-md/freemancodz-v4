import { createElement, type ReactNode } from "react";
import type { ChatMessage } from "./types";

export function isExternalUrl(url: string) {
  return /^https?:\/\//.test(url);
}