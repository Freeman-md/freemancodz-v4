import { type NextRequest, NextResponse } from "next/server";

import { getRateLimitHmacSecret } from "@/infrastructure/config/env";
import type { Logger } from "@/infrastructure/logging/logger";
import type { AssistantService } from "@/modules/assistant/service";
import type { RateLimitService } from "@/modules/rate-limit/service";

import { checkChatRateLimit, parseChatRequest, resolveWorkflowSession } from "./helpers";

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
    const parsed = await parseChatRequest(request);

    if (parsed instanceof NextResponse) {
      return parsed;
    }

    const rateLimitResponse = await checkChatRateLimit(request, { rateLimitService, logger, onVercel });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = resolveWorkflowSession(request, parsed, onVercel, getAccessSecret);

    if (session instanceof NextResponse) {
      return session;
    }

    const response = new NextResponse(
      assistantService.createResponse(session.input, session.encodeWorkflowId),
      {
        headers: {
          "Cache-Control": "no-cache, no-transform",
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );

    if (session.cookie) {
      response.cookies.set(session.cookie.name, session.cookie.value, {
        httpOnly: true,
        sameSite: "strict",
        secure: session.cookie.secure,
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
