import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";
import { parsePortfolioBootstrapArguments } from "@/entrypoints/maintenance/bootstrap-portfolio.arguments";

test("production confirmation must be supplied separately by the operator", () => {
  assert.throws(
    () => parsePortfolioBootstrapArguments(["--production"]),
    /operator-supplied --confirm-production/,
  );
  assert.deepEqual(parsePortfolioBootstrapArguments(["--production", "--confirm-production"]), {
    production: true,
  });
});

test("an unconfirmed production invocation exits before configuration or mutation", async () => {
  const entrypoint = resolve(
    process.cwd(),
    "src/entrypoints/maintenance/bootstrap-portfolio.ts",
  );

  const result = await new Promise<{ code: number | null; stderr: string }>((resolveResult) => {
    const child = spawn(
      process.execPath,
      ["--conditions=react-server", "--import", "tsx", entrypoint, "--production"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DATABASE_URL: "mutation-must-not-be-reached",
          NEXT_PUBLIC_SUPABASE_URL: "mutation-must-not-be-reached",
          SUPABASE_SERVICE_ROLE_KEY: "mutation-must-not-be-reached",
        },
      },
    );

    let stderr = "";

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => resolveResult({ code, stderr }));
  });

  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /operator-supplied --confirm-production/);
  assert.doesNotMatch(result.stderr, /mutation-must-not-be-reached|Invalid URL/);
});
