import "server-only";

import {
  DAILY_RATE_LIMIT_MAX,
  DAILY_RATE_LIMIT_WINDOW_MS,
  SHORT_RATE_LIMIT_MAX,
  SHORT_RATE_LIMIT_WINDOW_MS,
} from "./chat-stream-constants";

type WindowCounter = {
  count: number;
  resetAt: number;
};

type RateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      error: string;
      limit: number;
      remaining: number;
      resetAt: number;
    };

const shortWindowCounters = new Map<string, WindowCounter>();
const dailyWindowCounters = new Map<string, WindowCounter>();

function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  return (
    forwardedFor?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    cfConnectingIp?.trim() ||
    "anonymous"
  );
}

function getCounter(
  counters: Map<string, WindowCounter>,
  key: string,
  now: number,
  windowMs: number,
) {
  const current = counters.get(key);

  if (!current || current.resetAt <= now) {
    const next = {
      count: 0,
      resetAt: now + windowMs,
    };

    counters.set(key, next);
    return next;
  }

  return current;
}

function pruneExpiredCounters(
  counters: Map<string, WindowCounter>,
  now: number,
) {
  for (const [key, counter] of counters) {
    if (counter.resetAt <= now) {
      counters.delete(key);
    }
  }
}

/** Bounded best-effort per-instance protection; configure host-level limits for global enforcement. */
export function checkAssistantRateLimit(request: Request): RateLimitResult {
  const now = Date.now();
  const clientIdentifier = getClientIdentifier(request);

  pruneExpiredCounters(shortWindowCounters, now);
  pruneExpiredCounters(dailyWindowCounters, now);

  const shortCounter = getCounter(
    shortWindowCounters,
    clientIdentifier,
    now,
    SHORT_RATE_LIMIT_WINDOW_MS,
  );
  const dailyCounter = getCounter(
    dailyWindowCounters,
    clientIdentifier,
    now,
    DAILY_RATE_LIMIT_WINDOW_MS,
  );

  if (shortCounter.count >= SHORT_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      error: "Too many messages. Please try again in a few minutes.",
      limit: SHORT_RATE_LIMIT_MAX,
      remaining: 0,
      resetAt: shortCounter.resetAt,
    };
  }

  if (dailyCounter.count >= DAILY_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      error: "Daily message limit reached. Please try again later.",
      limit: DAILY_RATE_LIMIT_MAX,
      remaining: 0,
      resetAt: dailyCounter.resetAt,
    };
  }

  shortCounter.count += 1;
  dailyCounter.count += 1;

  return { allowed: true };
}
