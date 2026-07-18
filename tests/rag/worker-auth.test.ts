import assert from "node:assert/strict";
import test from "node:test";
import { isAuthorizedWorkerSecret } from "@/lib/rag/indexing/worker-auth.core";

test("production worker authorization accepts only a matching bearer secret", () => {
  assert.equal(isAuthorizedWorkerSecret("secret", "secret"), true);
  assert.equal(isAuthorizedWorkerSecret("secret", "wrong"), false);
  assert.equal(isAuthorizedWorkerSecret("secret", null), false);
  assert.equal(isAuthorizedWorkerSecret(undefined, "secret"), false);
});
