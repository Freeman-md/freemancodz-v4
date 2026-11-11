import { type NextRequest, NextResponse } from "next/server";
import { readChatVisitorKey } from "./helpers";
import { createChatPostHandler } from "./post";

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };

  const visitorKey = readChatVisitorKey(request);

  if (!visitorKey) {
    return NextResponse.json(null, { headers });
  }

  const { workflowService, logger } = await import("@/modules/composition");

  try {
    return NextResponse.json(await workflowService.getActive(visitorKey), { headers });
  } catch {
    logger.error("chat.workflow_restore_failed");

    return NextResponse.json(
      { error: "Could not restore workflow progress." },
      { status: 503, headers },
    );
  }
}

export async function POST(request: NextRequest) {
  const { assistantService, logger, rateLimitService } = await import("@/modules/composition");

  return createChatPostHandler({
    assistantService,
    rateLimitService,
    logger,
  })(request);
}
