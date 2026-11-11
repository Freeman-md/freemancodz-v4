import { type NextRequest, NextResponse } from "next/server";

import type { Logger } from "@/infrastructure/logging/logger";
import type { AssistantService } from "@/modules/assistant/service";
import type { RateLimitService } from "@/modules/rate-limit/service";

import { checkChatRateLimit, getChatVisitor, parseChatRequest } from "./helpers";

export function createChatPostHandler({
  assistantService,
  rateLimitService,
  logger,
  onVercel = process.env.VERCEL === "1",
}: {
  assistantService: Pick<AssistantService, "createResponse">;
  rateLimitService: Pick<RateLimitService, "consume">;
  logger: Logger;
  onVercel?: boolean;
}) {
  return async function POST(request: NextRequest) {
    const parsed = await parseChatRequest(request);

    if (parsed instanceof NextResponse) {
      return parsed;
    }

    const visitorKey = getChatVisitor(request);

    if (visitorKey instanceof NextResponse) {
      return visitorKey;
    }

    const rateLimitResponse = await checkChatRateLimit(request, {
      rateLimitService,
      logger,
      onVercel,
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return new NextResponse(
      assistantService.createResponse({ ...parsed, visitorKey, signal: request.signal }),
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
