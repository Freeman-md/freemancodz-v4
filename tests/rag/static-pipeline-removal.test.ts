import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("the legacy static chunk builder and seed command are removed", () => {
  assert.equal(existsSync(new URL("../../src/lib/rag/build-site-chunks.ts", import.meta.url)), false);
  const packageJson = readFileSync(new URL("../../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /seed:chunks|test:rag-rpc/);
});
