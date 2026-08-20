import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import type { SearchIndexWorkerResult } from "@/contracts/search-index-worker.contract";
import { runSearchIndexWorkerOnce } from "@/server/entrypoints/jobs/run-search-index-worker";
import { requestAndRunSearchIndexRebuild } from "@/server/entrypoints/maintenance/rebuild-search-index";

const processed = {
  outcome: "processed",
  attempt: 1,
  documentCount: 4,
  chunkCount: 8,
  finalState: "completed",
} satisfies SearchIndexWorkerResult;

test("the run command processes at most one pending job and exits", async () => {
  let calls = 0;

  const result = await runSearchIndexWorkerOnce({
    processPendingJob: async () => {
      calls += 1;

      return processed;
    },
  });

  assert.equal(calls, 1);
  assert.deepEqual(result, processed);
});

test("the rebuild command requests work before reusing the one-shot path", async () => {
  const operations: string[] = [];

  const result = await requestAndRunSearchIndexRebuild({
    requestRebuild: async () => {
      operations.push("request");
    },
    processPendingJob: async () => {
      operations.push("process");

      return processed;
    },
  });

  assert.deepEqual(operations, ["request", "process"]);
  assert.deepEqual(result, processed);
});

async function runUnconfirmedProductionEntrypoint(entrypoint: string) {
  return new Promise<{ code: number | null; stderr: string }>((resolveResult) => {
    const child = spawn(
      process.execPath,
      ["--conditions=react-server", "--import", "tsx", entrypoint, "--production"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DATABASE_URL: "postgresql://guard.invalid/portfolio",
        },
      },
    );

    let stderr = "";

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => resolveResult({ code, stderr }));
  });
}

test("production indexing commands reject before composition without operator confirmation", async () => {
  for (const entrypoint of [
    resolve(process.cwd(), "src/server/entrypoints/jobs/run-search-index-worker.ts"),
    resolve(process.cwd(), "src/server/entrypoints/maintenance/rebuild-search-index.ts"),
  ]) {
    const result = await runUnconfirmedProductionEntrypoint(entrypoint);

    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /requires the --confirm-production flag/);
    assert.doesNotMatch(result.stderr, /OPENAI_API_KEY|Search index worker failed|rebuild failed/);
  }
});

test("package scripts expose only the four approved indexing operations", async () => {
  const packageJson = JSON.parse(
    await readFile(resolve(process.cwd(), "package.json"), "utf8"),
  ) as {
    scripts: Record<string, string>;
  };

  const operationalScripts = Object.keys(packageJson.scripts)
    .filter((name) => name.startsWith("index:"))
    .sort();

  assert.deepEqual(operationalScripts, [
    "index:rebuild",
    "index:rebuild:production",
    "index:run",
    "index:run:production",
  ]);

  assert.doesNotMatch(packageJson.scripts["index:run:production"] ?? "", /confirm-production/);
  assert.doesNotMatch(packageJson.scripts["index:rebuild:production"] ?? "", /confirm-production/);
});
