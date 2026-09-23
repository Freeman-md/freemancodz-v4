import { NextResponse } from "next/server";

import { assistantRequestSchema } from "@/contracts/assistant.contract";
import type { ILogger } from "@/infrastructure/logging/logger.interface";
import type { IAssistantService } from "@/modules/assistant/public";
import type { RateLimitRule } from "@/modules/rate-limit/rate-limit.types";
import type { RateLimitService } from "@/modules/rate-limit/service";

const CHAT_RATE_LIMIT_SCOPE = "chat";

const CHAT_RATE_LIMIT_RULES = [
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

function getVisitorIdentifier(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "anonymous"
  );
}

function rateLimitError(limit: number) {
  return limit === CHAT_RATE_LIMIT_RULES[0].limit
    ? "Too many messages. Please try again in a few minutes."
    : "Daily message limit reached. Please try again later.";
}

export function createChatPostHandler({
  assistantService,
  rateLimitService,
  logger,
}: {
  assistantService: IAssistantService;
  rateLimitService: Pick<RateLimitService, "consume">;
  logger: ILogger;
}) {
  return async function POST(request: Request) {
    let payload: unknown;

    try {
      payload = await request.json();
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

    let rateLimit;

    try {
      rateLimit = await rateLimitService.consume({
        scope: CHAT_RATE_LIMIT_SCOPE,
        identifier: getVisitorIdentifier(request),
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

    return new Response(
      assistantService.createResponse({
        message: parsed.data.message,
        previousResponseId: parsed.data.previousResponseId ?? null,
        workflowInstanceId: parsed.data.workflowInstanceId ?? null,
        workflowStart: parsed.data.workflowStart ?? null,
        signal: request.signal,
      }),
      {
        headers: {
          "Cache-Control": "no-cache, no-transform",
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  };
}

export async function POST(request: Request) {
  const { assistantService, logger, rateLimitService } = await import("@/modules/composition");

  return createChatPostHandler({ assistantService, rateLimitService, logger })(request);
}
