import { type NextRequest, NextResponse } from "next/server";

import { assistantRequestSchema, WORKFLOW_ACCESS_DENIED } from "@/contracts/assistant.contract";
import { getRateLimitHmacSecret } from "@/infrastructure/config/env";
import type { Logger } from "@/infrastructure/logging/logger";
import type { AssistantService } from "@/modules/assistant/service";
import type { RateLimitService } from "@/modules/rate-limit/service";

import { CHAT_RATE_LIMIT_RULES, CHAT_RATE_LIMIT_SCOPE } from "./constants";
import {
  createVisitorSession,
  createWorkflowAccess,
  getVisitorIdentifier,
  isVisitorSession,
  rateLimitError,
  readChatBody,
} from "./helpers";

export function createChatPostHandler({
  assistantService,
  rateLimitService,
  logger,
  getAccessSecret,
  onVercel = process.env.VERCEL === "1",
}: {
  assistantService: Pick<AssistantService, "createResponse">;
  rateLimitService: Pick<RateLimitService, "consume">;
  logger: Logger;
  getAccessSecret: () => string;
  onVercel?: boolean;
}) {
  return async function POST(request: NextRequest) {
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

    const secure = onVercel || request.nextUrl.protocol === "https:";

    const cookieName = secure ? "__Host-portfolio-chat" : "portfolio-chat";

    const cookie = request.cookies.get(cookieName)?.value;

    const existingSession = isVisitorSession(cookie) ? cookie : null;

    const session = existingSession ?? createVisitorSession();

    const access = createWorkflowAccess(session, getAccessSecret());

    const reference = parsed.data.workflowInstanceId;

    const workflowInstanceId = reference && existingSession ? access.decode(reference) : null;

    if (reference && !workflowInstanceId) {
      return NextResponse.json(
        { error: "This workflow is unavailable in this browser session.", code: WORKFLOW_ACCESS_DENIED },
        { status: 403 },
      );
    }

    const response = new NextResponse(
      assistantService.createResponse(
        {
          ...("action" in parsed.data
            ? { ...parsed.data, workflowInstanceId: workflowInstanceId! }
            : {
                message: parsed.data.message,
                previousResponseId: parsed.data.previousResponseId ?? null,
                workflowInstanceId,
              }),
          signal: request.signal,
        },
        access.encode,
      ),
      {
        headers: {
          "Cache-Control": "no-cache, no-transform",
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );

    if (!existingSession) {
      response.cookies.set(cookieName, session, {
        httpOnly: true,
        sameSite: "strict",
        secure,
        path: "/",
      });
    }

    return response;
  };
}

export async function POST(request: NextRequest) {
  const { assistantService, logger, rateLimitService } = await import("@/modules/composition");

  return createChatPostHandler({
    assistantService,
    rateLimitService,
    logger,
    getAccessSecret: getRateLimitHmacSecret,
  })(request);
}
