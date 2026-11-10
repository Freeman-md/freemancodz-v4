import type { RateLimitRule } from "@/modules/rate-limit/rate-limit.types";

export const MAX_CHAT_BODY_BYTES = 8 * 1024;

export const CHAT_RATE_LIMIT_SCOPE = "chat";

export const WORKFLOW_STATUS_RATE_LIMIT_SCOPE = "workflow-status";

export const WORKFLOW_STATUS_RATE_LIMIT_RULES = [
  { id: "minute", limit: 24, windowMs: 60 * 1000 },
] as const satisfies readonly RateLimitRule[];

export const CHAT_RATE_LIMIT_RULES = [
  {
    id: "short",
    limit: 10,
    windowMs: 10 * 60 * 1000,
  },
  {
    id: "daily",
    limit: 30,
    windowMs: 24 * 60 * 60 * 1000,
  },
] as const satisfies readonly RateLimitRule[];
