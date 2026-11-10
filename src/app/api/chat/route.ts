import { after, type NextRequest, NextResponse } from "next/server";

import { getRateLimitHmacSecret, isWorkflowPreviewConfigured } from "@/infrastructure/config/env";
import type { Logger } from "@/infrastructure/logging/logger";
import type { AssistantService } from "@/modules/assistant/service";
import type { RateLimitService } from "@/modules/rate-limit/service";

import { checkChatRateLimit, parseChatRequest, resolveWorkflowSession } from "./helpers";

export function createChatPostHandler({
  assistantService,
  rateLimitService,
  logger,
  getAccessSecret,
  scheduleExecution,
  onVercel = process.env.VERCEL === "1",
}: {
  assistantService: Pick<AssistantService, "createResponse">;
  rateLimitService: Pick<RateLimitService, "consume">;
  logger: Logger;
  getAccessSecret: () => string;
  scheduleExecution?: (executionId: Promise<string | undefined>) => void;
  onVercel?: boolean;
}) {
  return async function POST(request: NextRequest) {
    const parsed = await parseChatRequest(request);

    if (parsed instanceof NextResponse) {
      return parsed;
    }

    const statusOnly = "action" in parsed && parsed.action === "workflow_status";

    const rateLimitResponse = await checkChatRateLimit(request, {
      rateLimitService,
      logger,
      onVercel,
      statusOnly,
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = resolveWorkflowSession(request, parsed, onVercel, getAccessSecret);

    if (session instanceof NextResponse) {
      return session;
    }

    const pending =
      scheduleExecution && "action" in session.input && session.input.action !== "workflow_status"
        ? Promise.withResolvers<string | undefined>()
        : null;

    if (pending) {
      scheduleExecution?.(pending.promise);
    }

    const response = new NextResponse(
      assistantService.createResponse(session.input, session.encodeWorkflowId, pending?.resolve),
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
  if (!isWorkflowPreviewConfigured()) {
    return NextResponse.json(
      { error: "The isolated Preview workflow is not configured." },
      { status: 503 },
    );
  }

  const { assistantService, logger, rateLimitService, workflowExecutionService } =
    await import("@/modules/composition");

  return createChatPostHandler({
    assistantService,
    rateLimitService,
    logger,
    getAccessSecret: getRateLimitHmacSecret,
    scheduleExecution: (executionId) =>
      after(async () => {
        const id = await executionId;

        if (id) {
          await workflowExecutionService.runDue(id);
        }
      }),
  })(request);
}
