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
  assistantService: Pick<AssistantService, "createResponse" | "describeWorkflowResult">;
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

    if ("reviewId" in parsed) {
      const headers = { "Cache-Control": "private, no-store" };

      try {
        const result = await assistantService.describeWorkflowResult({
          ...parsed,
          visitorKey,
          signal: request.signal,
        });

        return result
          ? NextResponse.json(result, { headers })
          : NextResponse.json({ error: "Approved review unavailable." }, { status: 404, headers });
      } catch {
        logger.error("chat.workflow_result_failed");

        return NextResponse.json(
          { error: "Could not read the saved result." },
          { status: 503, headers },
        );
      }
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
