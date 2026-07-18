import assert from "node:assert/strict";
import test from "node:test";
import { parseIndexingJob } from "@/lib/rag/indexing-job-validation";

test("queue payload validation accepts only bounded source identities and operations", () => {
  assert.deepEqual(parseIndexingJob({ sourceType: "projects", sourceId: "id", operation: "upsert" }), { sourceType: "projects", sourceId: "id", operation: "upsert" });
  assert.throws(() => parseIndexingJob({ sourceType: "unknown", sourceId: "id", operation: "upsert" }), /Invalid/);
  assert.throws(() => parseIndexingJob({ sourceType: "projects", sourceId: "", operation: "upsert" }), /Invalid/);
  assert.throws(() => parseIndexingJob({ sourceType: "projects", sourceId: "id", operation: "replace" }), /Invalid/);
});
