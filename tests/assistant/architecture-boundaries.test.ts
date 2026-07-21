import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";
import { POST } from "@/app/api/chat/route";

const root = process.cwd();
const source = (path: string) => readFile(`${root}/${path}`, "utf8");

test("assistant route validates malformed input and accepts the public request shape", async () => {
  const invalidJson = await POST(new Request("https://example.test/api/chat", { method: "POST", body: "{" }));
  assert.equal(invalidJson.status, 400);

  const missing = await POST(new Request("https://example.test/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) }));
  assert.equal(missing.status, 400);

  const oversized = await POST(new Request("https://example.test/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: "x".repeat(501) }) }));
  assert.equal(oversized.status, 400);

  const originalError = console.error;
  console.error = () => undefined;
  try {
    const valid = await POST(new Request("https://example.test/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: "What has Freeman built?", previousResponseId: null }) }));
    assert.equal(valid.status, 200);
    await valid.body?.cancel();
  } finally {
    console.error = originalError;
  }
});

test("assistant markdown delegates supported formatting to the safe maintained renderer", async () => {
  const markdown = await source("src/features/assistant/components/AssistantMarkdown.tsx");
  assert.match(markdown, /import ReactMarkdown from "react-markdown"/);
  assert.doesNotMatch(markdown, /rehypeRaw|skipHtml=\{false\}/);
  for (const element of ["h1", "p", "ul", "ol", "code", "a"]) {
    assert.match(markdown, new RegExp(`${element}:`));
  }
  assert.match(markdown, /rel=\{external \? "noreferrer"/);
});

test("assistant and search server boundaries stay explicit and route adapters stay thin", async () => {
  const [route, retrieval, match, response, searchWorker, lint, session] = await Promise.all([
    source("src/app/api/chat/route.ts"),
    source("src/features/assistant/server/retrieve-context.ts"),
    source("src/features/assistant/server/match-site-chunks.ts"),
    source("src/features/assistant/server/create-assistant-response.ts"),
    source("src/features/search-index/server/index-worker.ts"),
    source("eslint.config.mjs"),
    source("src/features/assistant/use-assistant.ts"),
  ]);
  assert.doesNotMatch(route, /@\/lib\/(db|openai)/);
  assert.match(route, /createAssistantResponse/);
  assert.match(retrieval, /^import "server-only";/);
  assert.match(match, /^import "server-only";/);
  assert.match(response, /^import "server-only";/);
  assert.match(searchWorker, /^import "server-only";/);
  assert.match(retrieval, /matchSiteChunks\(queryEmbedding, 20, 0\.25\)/);
  assert.match(match, /queryEmbedding\.length !== 1536/);
  assert.doesNotMatch(retrieval, /supabase/i);
  assert.match(lint, /@\/app\/\*/);
  assert.match(lint, /@\/features\/\*\/server\/\*/);
  assert.match(session, /onResponseId\(responseId\)/);
  assert.match(session, /event\.key === "Escape"/);
  assert.match(session, /addEventListener\("pointerdown"/);
});

test("eslint rejects representative client-to-server and feature-to-app imports", async () => {
  const eslint = new ESLint({ overrideConfigFile: `${root}/eslint.config.mjs` });
  const [clientResult, featureResult] = await Promise.all([
    eslint.lintText('import "@/features/assistant/server/retrieve-context";', { filePath: `${root}/src/features/assistant/components/BoundaryFixture.tsx` }),
    eslint.lintText('import "@/app/page";', { filePath: `${root}/src/features/portfolio/types.ts` }),
  ]);
  assert.ok(clientResult[0]?.messages.some((message) => message.ruleId === "no-restricted-imports"));
  assert.ok(featureResult[0]?.messages.some((message) => message.ruleId === "no-restricted-imports"));
});
