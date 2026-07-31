import assert from "node:assert/strict";
import test from "node:test";
test("worker route remains a callable HTTP adapter", async () => { process.env.OPENAI_API_KEY ??= "test"; const { GET } = await import("@/app/api/internal/search-index-worker/route"); const response = await GET(new Request("http://localhost/api/internal/search-index-worker")); assert.ok([401, 500].includes(response.status)); });
