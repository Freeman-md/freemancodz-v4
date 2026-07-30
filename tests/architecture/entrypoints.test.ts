import assert from "node:assert/strict";
import test from "node:test";

import { parseIndexSourceInput } from "@/server/modules/search-index/schemas/index-source-input.schema";
import { requireProductionConfirmation } from "@/server/entrypoints/maintenance/require-production-confirmation";
import { runIndexWorkerLoop } from "@/server/entrypoints/jobs/run-search-index-worker";

test("entrypoint input parsing accepts valid argv values and rejects invalid values", () => {
  assert.deepEqual(parseIndexSourceInput("projects", "project-1"), { sourceType: "projects", sourceId: "project-1" });
  assert.throws(() => parseIndexSourceInput("unknown", "project-1"));
  assert.throws(() => parseIndexSourceInput("projects", ""));
});

test("production confirmation requires an explicit confirmation flag", () => {
  const originalUrl = process.env.DATABASE_URL;
  const originalArgv = process.argv;
  const originalLog = console.log;
  process.env.DATABASE_URL = "postgres://example.test/portfolio";
  console.log = () => undefined;
  try {
    process.argv = ["node", "entrypoint"];
    assert.throws(() => requireProductionConfirmation(), /--confirm-production/);
    process.argv = ["node", "entrypoint", "--confirm-production"];
    assert.doesNotThrow(() => requireProductionConfirmation());
  } finally {
    process.argv = originalArgv;
    console.log = originalLog;
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
  }
});

test("worker loop exits without polling once shutdown is requested", async () => {
  let calls = 0;
  await runIndexWorkerLoop({
    runBatch: async () => ({ claimed: ++calls, completed: 0, retried: 0, failed: 0 }),
    isStopping: () => calls > 0,
  });
  assert.equal(calls, 1);
});
