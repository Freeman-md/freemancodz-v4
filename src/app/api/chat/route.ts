import { NextResponse } from "next/server";

import { assistantRequestSchema } from "@/features/assistant/schema";
import { createAssistantResponse } from "@/features/assistant/server/create-assistant-response";
import { checkAssistantRateLimit } from "@/features/assistant/server/rate-limit";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = assistantRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request." }, { status: 400 });
  }

  const rateLimit = checkAssistantRateLimit(request);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.error }, {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))),
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
      },
    });
  }

  return new Response(createAssistantResponse({
    message: parsed.data.message,
    previousResponseId: parsed.data.previousResponseId ?? null,
    signal: request.signal,
  }), {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
