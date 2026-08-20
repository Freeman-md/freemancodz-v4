import { NextResponse } from "next/server";

import { assistantRequestSchema } from "@/contracts/assistant.contract";
import type { IAssistantService } from "@/server/modules/assistant/public";

export function createChatPostHandler({
  assistantService,
}: {
  assistantService: IAssistantService;
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

    const rateLimit = assistantService.checkRateLimit(
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip")?.trim() ||
        request.headers.get("cf-connecting-ip")?.trim() ||
        "anonymous",
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.error },
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
  const { assistantService } = await import("@/server/composition-root");

  return createChatPostHandler({ assistantService })(request);
}
