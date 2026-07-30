import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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

test("intermediate architecture boundaries remain explicit while mapped paths migrate", async () => {
  const [route, retrieval, match, response, searchWorker, lint] = await Promise.all([
    source("src/app/api/chat/route.ts"),
    source("src/server/modules/assistant/services/retrieve-assistant-context.service.ts"),
    source("src/server/modules/search-index/repositories/match-site-chunks.repository.ts"),
    source("src/server/modules/assistant/services/create-assistant-response.service.ts"),
    source("src/server/modules/search-index/services/run-index-worker.service.ts"),
    source("eslint.config.mjs"),
  ]);
  assert.doesNotMatch(route, /@\/lib\/(db|openai)/);
  assert.match(route, /createAssistantResponse/);
  assert.match(retrieval, /^import "server-only";/);
  assert.match(match, /^import "server-only";/);
  assert.match(response, /^import "server-only";/);
  assert.match(searchWorker, /^import "server-only";/);
  assert.match(retrieval, /searchSiteIndex\(queryEmbedding\)/);
  assert.match(match, /queryEmbedding\.length !== 1536/);
  assert.doesNotMatch(retrieval, /supabase/i);
  assert.match(lint, /@\/app\/\*/);
  assert.match(lint, /@\/features\/\*\/server\/\*/);
});

test("eslint rejects representative client-to-server and feature-to-app imports", async () => {
  const eslint = new ESLint({ overrideConfigFile: `${root}/eslint.config.mjs` });
  const [clientResult, featureResult, appClientResult] = await Promise.all([
    eslint.lintText('import "@/features/assistant/server/retrieve-context";', { filePath: `${root}/src/features/assistant/components/BoundaryFixture.tsx` }),
    eslint.lintText('import "@/app/page";', { filePath: `${root}/src/features/portfolio/types.ts` }),
    eslint.lintText('import "@/lib/openai";', { filePath: `${root}/src/app/error.tsx` }),
  ]);
  assert.ok(clientResult[0]?.messages.some((message) => message.ruleId === "no-restricted-imports"));
  assert.ok(featureResult[0]?.messages.some((message) => message.ruleId === "no-restricted-imports"));
  assert.ok(appClientResult[0]?.messages.some((message) => message.ruleId === "no-restricted-imports"));
});

test("operational package commands point directly to existing entrypoints", async () => {
  const packageJson = JSON.parse(await source("package.json")) as { scripts: Record<string, string> };
  const commandNames = ["seed:portfolio", "seed:portfolio:production", "index:source", "index:worker", "index:worker:production", "index:rebuild", "index:rebuild:production", "index:status", "index:status:production", "index:preview"];

  for (const name of commandNames) {
    const command = packageJson.scripts[name];
    assert.match(command, /src\/server\/entrypoints\//);
    assert.doesNotMatch(command, /scripts\/|prisma\/seed\.ts/);
    const target = command.match(/src\/server\/entrypoints\/[^\s]+\.ts/)?.[0];
    assert.ok(target, `${name} resolves an entrypoint`);
    await access(`${root}/${target}`);
  }
});
