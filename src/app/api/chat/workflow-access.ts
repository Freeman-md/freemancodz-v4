import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

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
