import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("production worker endpoint delegates one bounded batch to the shared worker", () => {
  const route = readFileSync(new URL("../../src/app/api/internal/search-index/route.ts", import.meta.url), "utf8");
  assert.match(route, /processIndexingJobs\(10\)/);
  assert.match(route, /isAuthorizedWorkerSecret/);
});

test("Prisma retrieval maps assistant fields, filters threshold, and orders cosine similarity", () => {
  const query = readFileSync(new URL("../../src/lib/rag/match-site-chunks.ts", import.meta.url), "utf8");
  assert.match(query, /SELECT id, title, category, url, content, keywords/);
  assert.match(query, /embedding <=> .*>= \$\{matchThreshold\}/);
  assert.match(query, /ORDER BY embedding <=>/);
  assert.doesNotMatch(query, /\.rpc\(/);
});
