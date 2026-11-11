import type { RateLimitRule } from "@/modules/rate-limit/rate-limit.types";

export const MAX_CHAT_BODY_BYTES = 8 * 1024;

export const SECURE_CHAT_VISITOR_COOKIE = process.env.NODE_ENV === "production";
export const CHAT_VISITOR_COOKIE = SECURE_CHAT_VISITOR_COOKIE
  ? "__Host-chat-visitor"
  : "chat-visitor";

export const CHAT_RATE_LIMIT_SCOPE = "chat";

export const CHAT_RATE_LIMIT_RULES = [
  {
    id: "short",
    limit: 40,
    windowMs: 10 * 60 * 1000,
  },
  {
    id: "daily",
    limit: 100,
    windowMs: 24 * 60 * 60 * 1000,
  },
] as const satisfies readonly RateLimitRule[];
