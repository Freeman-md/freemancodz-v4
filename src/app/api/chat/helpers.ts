import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

import { CHAT_RATE_LIMIT_RULES, MAX_CHAT_BODY_BYTES } from "./constants";

// Rate limiting
export function getVisitorIdentifier(request: Request, onVercel: boolean) {
  const ip = onVercel ? request.headers.get("x-vercel-forwarded-for")?.trim() : undefined;

  return ip && isIP(ip) ? ip : "anonymous";
}

export function rateLimitError(limit: number) {
  return limit === CHAT_RATE_LIMIT_RULES[0].limit
    ? "Too many messages. Please try again in a few minutes."
    : "Daily message limit reached. Please try again later.";
}

// Request body
export async function readChatBody(request: Request): Promise<string | null> {
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

// Workflow session access
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

export function createVisitorSession() {
  return randomBytes(32).toString("base64url");
}

export function isVisitorSession(value: string | undefined): value is string {
  return value !== undefined && /^[A-Za-z0-9_-]{43}$/.test(value);
}
