import { type NextRequest, NextResponse } from "next/server";

import type { Logger } from "@/infrastructure/logging/logger";
import type { AssistantService } from "@/modules/assistant/service";
import type { RateLimitService } from "@/modules/rate-limit/service";

import { checkChatRateLimit, parseChatRequest } from "./helpers";

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

    const rateLimitResponse = await checkChatRateLimit(request, {
      rateLimitService,
      logger,
      onVercel,
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return new NextResponse(
      assistantService.createResponse({ ...parsed, signal: request.signal }),
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

export async function POST(request: NextRequest) {
  const { assistantService, logger, rateLimitService } = await import("@/modules/composition");

  return createChatPostHandler({
    assistantService,
    rateLimitService,
    logger,
  })(request);
}
