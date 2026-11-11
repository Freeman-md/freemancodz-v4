import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { type NextRequest, NextResponse } from "next/server";

import { assistantRequestSchema, type AssistantRequest } from "@/contracts/assistant.contract";
import type { Logger } from "@/infrastructure/logging/logger";
import type { RateLimitService } from "@/modules/rate-limit/service";

import {
  CHAT_RATE_LIMIT_RULES,
  CHAT_RATE_LIMIT_SCOPE,
  CHAT_VISITOR_COOKIE,
  MAX_CHAT_BODY_BYTES,
  SECURE_CHAT_VISITOR_COOKIE,
} from "./constants";

// Request parsing
export async function parseChatRequest(request: Request): Promise<AssistantRequest | NextResponse> {
  let payload: unknown;

  try {
    const body = await readChatBody(request);

    if (body === null) {
      return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    }

    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = assistantRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid request." },
      { status: 400 },
    );
  }

  return parsed.data;
}

async function readChatBody(request: Request): Promise<string | null> {
  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();

  const body = new Uint8Array(MAX_CHAT_BODY_BYTES);

  let size = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        return new TextDecoder().decode(body.subarray(0, size));
      }

      if (size + value.byteLength > MAX_CHAT_BODY_BYTES) {
        void reader.cancel().catch(() => undefined);

        return null;
      }

      body.set(value, size);
      size += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
}

export function readChatVisitorKey(request: NextRequest): string | null {
  const token = request.cookies.get(CHAT_VISITOR_COOKIE)?.value;

  return token && /^[a-f0-9]{64}$/.test(token)
    ? createHash("sha256").update(token).digest("hex")
    : null;
}

// Establish the browser session before a chat turn can persist a workflow.
export function getChatVisitor(request: NextRequest): string | NextResponse {
  const visitorKey = readChatVisitorKey(request);

  if (visitorKey) {
    return visitorKey;
  }

  const response = NextResponse.json(
    { error: "A browser session is required. Please try again." },
    { status: 428, headers: { "Cache-Control": "no-store" } },
  );

  response.cookies.set(CHAT_VISITOR_COOKIE, randomBytes(32).toString("hex"), {
    httpOnly: true,
    secure: SECURE_CHAT_VISITOR_COOKIE,
    sameSite: "strict",
    path: "/",
  });

  return response;
}

// Rate limiting
export async function checkChatRateLimit(
  request: Request,
  {
    rateLimitService,
    logger,
    onVercel,
  }: {
    rateLimitService: Pick<RateLimitService, "consume">;
    logger: Logger;
    onVercel: boolean;
  },
): Promise<NextResponse | null> {
  let rateLimit;

  try {
    rateLimit = await rateLimitService.consume({
      scope: CHAT_RATE_LIMIT_SCOPE,
      identifier: getVisitorIdentifier(request, onVercel),
      rules: CHAT_RATE_LIMIT_RULES,
    });
  } catch {
    logger.error("chat.rate_limit_failed", {
      category: "rate_limit_failure",
      scope: CHAT_RATE_LIMIT_SCOPE,
    });

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimitError(rateLimit.limit) },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
        },
      },
    );
  }

  return null;
}

function getVisitorIdentifier(request: Request, onVercel: boolean) {
  const ip = onVercel ? request.headers.get("x-vercel-forwarded-for")?.trim() : undefined;

  return ip && isIP(ip) ? ip : "anonymous";
}

function rateLimitError(limit: number) {
  return limit === CHAT_RATE_LIMIT_RULES[0].limit
    ? "Too many messages. Please try again in a few minutes."
    : "Daily message limit reached. Please try again later.";
}
