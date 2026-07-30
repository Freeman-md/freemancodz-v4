import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";
import { POST } from "@/app/api/chat/route";

const root = process.cwd();
const source = (path: string) => readFile(`${root}/${path}`, "utf8");

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(`${root}/${directory}`, { withFileTypes: true });
  const paths = await Promise.all(entries.map(async (entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? sourceFiles(path) : [path];
  }));

  return paths.flat().filter((path) => /\.(ts|tsx)$/.test(path));
}

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

test("final architecture boundaries keep route, module, provider, and search layers explicit", async () => {
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
  assert.match(lint, /@\/server\/modules\/\*\/schemas\/\*/);
});

test("eslint rejects representative client-to-server, feature-to-app, and entrypoint-private imports", async () => {
  const eslint = new ESLint({ overrideConfigFile: `${root}/eslint.config.mjs` });
  const [clientResult, featureResult, appClientResult, entrypointResult] = await Promise.all([
    eslint.lintText('import "@/server/modules/assistant/providers/openai-response.provider";', { filePath: `${root}/src/features/assistant/components/BoundaryFixture.tsx` }),
    eslint.lintText('import "@/app/page";', { filePath: `${root}/src/features/portfolio/types.ts` }),
    eslint.lintText('import "@/lib/openai";', { filePath: `${root}/src/app/error.tsx` }),
    eslint.lintText('import "@/server/modules/search-index/schemas/index-source-input.schema";', { filePath: `${root}/src/server/entrypoints/cli/BoundaryFixture.ts` }),
  ]);
  assert.ok(clientResult[0]?.messages.some((message) => message.ruleId === "no-restricted-imports"));
  assert.ok(featureResult[0]?.messages.some((message) => message.ruleId === "no-restricted-imports"));
  assert.ok(appClientResult[0]?.messages.some((message) => message.ruleId === "no-restricted-imports"));
  assert.ok(entrypointResult[0]?.messages.some((message) => message.ruleId === "no-restricted-imports"));
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

test("final source tree has no legacy ownership paths or cross-module internal imports", async () => {
  const paths = await sourceFiles("src");
  const sourceByPath = new Map(await Promise.all(paths.map(async (path) => [path, await source(path)] as const)));

  assert.ok(!paths.some((path) => path.startsWith("src/components/") || path.startsWith("src/lib/") || path.startsWith("src/data/")));
  assert.ok(!paths.some((path) => /\/(models|state)\/.*\.(model|state)\.tsx?$/.test(path)));
  assert.ok(!paths.includes("src/server/modules/search-index/mappers/index.ts"));

  for (const [path, contents] of sourceByPath) {
    assert.doesNotMatch(contents, /@\/features\/[^/]+\/server\//, path);
    if (path.startsWith("src/features/")) {
      assert.doesNotMatch(contents, /@\/server\//, path);
    }
    if (path.startsWith("src/server/") && !path.startsWith("src/server/entrypoints/")) {
      assert.doesNotMatch(contents, /@\/features\//, path);
    }
    if (path.startsWith("src/app/") || path.startsWith("src/server/entrypoints/")) {
      const moduleImports = contents.match(/@\/server\/modules\/[^"']+/g) ?? [];
      assert.ok(moduleImports.every((moduleImport) => moduleImport.endsWith("/public")), path);
    }
  }
});
