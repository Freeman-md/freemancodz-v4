import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { type NextRequest, NextResponse } from "next/server";

import {
  assistantRequestSchema,
  WORKFLOW_ACCESS_DENIED,
  type AssistantRequest,
} from "@/contracts/assistant.contract";
import type { Logger } from "@/infrastructure/logging/logger";
import type { AssistantResponseInput } from "@/modules/assistant/types";
import type { RateLimitService } from "@/modules/rate-limit/service";

import {
  CHAT_RATE_LIMIT_RULES,
  CHAT_RATE_LIMIT_SCOPE,
  MAX_CHAT_BODY_BYTES,
  WORKFLOW_STATUS_RATE_LIMIT_RULES,
  WORKFLOW_STATUS_RATE_LIMIT_SCOPE,
} from "./constants";

// Request parsing
export async function parseChatRequest(request: Request): Promise<AssistantRequest | NextResponse> {
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

  return parsed.data;
}

async function readChatBody(request: Request): Promise<string | null> {
  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();

  const body = new Uint8Array(MAX_CHAT_BODY_BYTES);

  let size = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        return new TextDecoder().decode(body.subarray(0, size));
      }

      if (size + value.byteLength > MAX_CHAT_BODY_BYTES) {
        void reader.cancel().catch(() => undefined);

        return null;
      }

      body.set(value, size);
      size += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
}

// Rate limiting
export async function checkChatRateLimit(
  request: Request,
  {
    rateLimitService,
    logger,
    onVercel,
    statusOnly,
  }: {
    rateLimitService: Pick<RateLimitService, "consume">;
    logger: Logger;
    onVercel: boolean;
    statusOnly: boolean;
  },
): Promise<NextResponse | null> {
  const scope = statusOnly ? WORKFLOW_STATUS_RATE_LIMIT_SCOPE : CHAT_RATE_LIMIT_SCOPE;

  let rateLimit;

  try {
    rateLimit = await rateLimitService.consume({
      scope,
      identifier: getVisitorIdentifier(request, onVercel),
      rules: statusOnly ? WORKFLOW_STATUS_RATE_LIMIT_RULES : CHAT_RATE_LIMIT_RULES,
    });
  } catch {
    logger.error("chat.rate_limit_failed", {
      category: "rate_limit_failure",
      scope,
    });

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: statusOnly
          ? "Too many status checks. Please try again shortly."
          : rateLimitError(rateLimit.limit),
      },
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

  return null;
}

function getVisitorIdentifier(request: Request, onVercel: boolean) {
  const ip = onVercel ? request.headers.get("x-vercel-forwarded-for")?.trim() : undefined;

  return ip && isIP(ip) ? ip : "anonymous";
}

function rateLimitError(limit: number) {
  return limit === CHAT_RATE_LIMIT_RULES[0].limit
    ? "Too many messages. Please try again in a few minutes."
    : "Daily message limit reached. Please try again later.";
}

// Workflow session access
export function resolveWorkflowSession(
  request: NextRequest,
  parsed: AssistantRequest,
  onVercel: boolean,
  getAccessSecret: () => string,
) {
  const secure = onVercel || request.nextUrl.protocol === "https:";

  const cookieName = secure ? "__Host-portfolio-chat" : "portfolio-chat";

  const cookie = request.cookies.get(cookieName)?.value;

  const existingSession = isVisitorSession(cookie) ? cookie : null;

  const session = existingSession ?? createVisitorSession();

  const access = createWorkflowAccess(session, getAccessSecret());

  const reference = parsed.workflowInstanceId;

  const workflowInstanceId = reference && existingSession ? access.decode(reference) : null;

  const verifiedRequest =
    "action" in parsed
      ? workflowInstanceId && { ...parsed, workflowInstanceId }
      : { ...parsed, workflowInstanceId };

  if (!verifiedRequest || (reference && !workflowInstanceId)) {
    return NextResponse.json(
      {
        error: "This workflow is unavailable in this browser session.",
        code: WORKFLOW_ACCESS_DENIED,
      },
      { status: 403 },
    );
  }

  return {
    input: { ...verifiedRequest, signal: request.signal } satisfies AssistantResponseInput,
    encodeWorkflowId: access.encode,
    cookie: existingSession ? null : { name: cookieName, value: session, secure },
  };
}

export function createWorkflowAccess(session: string, secret: string) {
  function sign(instanceId: string) {
    return createHmac("sha256", secret)
      .update(JSON.stringify(["assistant-workflow-access-v1", session, instanceId]))
      .digest("base64url");
  }

  return {
    encode(instanceId: string) {
      return `${instanceId}.${sign(instanceId)}`;
    },
    decode(reference: string) {
      const [instanceId, signature, extra] = reference.split(".");

      if (!instanceId || !signature || extra !== undefined) {
        return null;
      }

      const expected = Buffer.from(sign(instanceId));

      const actual = Buffer.from(signature);

      return actual.length === expected.length && timingSafeEqual(actual, expected)
        ? instanceId
        : null;
    },
  };
}

function createVisitorSession() {
  return randomBytes(32).toString("base64url");
}

function isVisitorSession(value: string | undefined): value is string {
  return value !== undefined && /^[A-Za-z0-9_-]{43}$/.test(value);
}
