import { spawn } from "node:child_process";
import { once } from "node:events";
import { access, copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { requirePassingTap, withDisposablePostgres } from "../integration/disposable-postgres.ts";

async function freePort() {
  const socket = createServer();

  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;

  await new Promise((resolve, reject) =>
    socket.close((error) => (error ? reject(error) : resolve())),
  );

  return port;
}

export async function browserPrerequisites() {
  try {
    const browsers = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");

    await access(process.env.CHROMIUM_EXECUTABLE ?? browsers.chromium.executablePath());
    await access(process.env.WEBKIT_EXECUTABLE ?? browsers.webkit.executablePath());
  } catch {
    throw new Error(
      "Matching Playwright module/browser prerequisites are unavailable. Set PLAYWRIGHT_MODULE and, when needed, CHROMIUM_EXECUTABLE and WEBKIT_EXECUTABLE to the verified installed engines.",
    );
  }
}

export async function runStagedWorkflow(fixture, mode = "all") {
  const root = process.cwd();

  const temporary = await mkdtemp("/tmp/freemancodz-browser-");

  const app = join(temporary, "app");

  const counts = { tests: 0, pass: 0, fail: 0, skipped: 0, cancelled: 0 };

  try {
    const environment = {
      ...fixture.environment,
      NODE_ENV: "production",
      PLAYWRIGHT_MODULE: process.env.PLAYWRIGHT_MODULE ?? "playwright",
      CHROMIUM_EXECUTABLE: process.env.CHROMIUM_EXECUTABLE,
      WEBKIT_EXECUTABLE: process.env.WEBKIT_EXECUTABLE,
    };

    const command = async (label, binary, args, cwd = app, env = environment) => {
      const result = await fixture.run(binary, args, { cwd, env, timeout: 300_000 });

      process.stdout.write(result.output);
      console.log(`${label}: exit ${result.code}`);
      if (result.code !== 0) {
        throw Object.assign(new Error(`${label} failed; see redacted diagnostics above.`), {
          exitCode: result.code,
        });
      }

      return result.output;
    };

    for (const variant of mode === "browser-only"
      ? ["meeting"]
      : mode === "build-only"
        ? ["production"]
        : ["production", "meeting"]) {
      await command(
        `Stage ${variant}`,
        process.execPath,
        ["tests/e2e/stage-workflow-variant.mjs", app, variant],
        root,
      );
      await command(`Generate ${variant}`, process.execPath, [
        "node_modules/prisma/build/index.js",
        "generate",
      ]);
      if (variant === "meeting") {
        for (const file of [
          "tests/e2e/workflow.test.ts",
          "tests/e2e/workflow-status.test.ts",
          "tests/e2e/assistant.test.ts",
          "tests/e2e/browser.config.mjs",
          "tests/integration/disposable-target.ts",
        ]) {
          await mkdir(join(app, file, ".."), { recursive: true });
          await copyFile(resolve(file), join(app, file));
        }

        await writeFile(
          join(app, "public/images/__engineering_fixture.json"),
          JSON.stringify({ fixture: environment.FREEMANCODZ_FIXTURE_ID }),
        );
      }

      // Bundled Next 16 docs support --webpack; it permits the shared installed dependency link.
      await command(`Build ${variant}`, process.execPath, [
        "node_modules/next/dist/bin/next",
        "build",
        "--webpack",
      ]);
      if (variant === "production") {
        await rm(app, { recursive: true });
      }
    }

    if (mode === "build-only") {
      return { code: 0 };
    }

    const port = await freePort();

    const origin = `http://127.0.0.1:${port}`;

    const browserEnvironment = {
      ...environment,
      FREEMANCODZ_FIXTURE_APP_ORIGIN: origin,
      WORKFLOW_E2E_URL: origin,
      HOMEPAGE_URL: origin,
    };

    const server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      { cwd: app, env: browserEnvironment, stdio: ["ignore", "pipe", "pipe"] },
    );

    let serverOutput = "";

    server.stdout.on("data", (chunk) => {
      serverOutput += chunk;
    });
    server.stderr.on("data", (chunk) => {
      serverOutput += chunk;
    });
    const exited = once(server, "exit");

    try {
      let ready = false;

      for (let attempt = 0; attempt < 100; attempt++) {
        try {
          const response = await fetch(`${origin}/images/__engineering_fixture.json`, {
            redirect: "error",
            signal: AbortSignal.timeout(1000),
          });

          ready =
            response.ok && (await response.json()).fixture === environment.FREEMANCODZ_FIXTURE_ID;
        } catch {
          /* Bound local startup polling only. */
        }

        if (ready || server.exitCode !== null) {
          break;
        }

        await delay(200);
      }

      if (!ready) {
        throw new Error("Fixture Next HTTP server did not become ready.");
      }

      for (const files of [
        ["tests/e2e/workflow.test.ts", "tests/e2e/workflow-status.test.ts"],
        ["tests/e2e/assistant.test.ts"],
      ]) {
        const output = await command(
          `Browser ${files.join(",")}`,
          process.execPath,
          [
            "--conditions=react-server",
            "--import",
            "tsx",
            "--test",
            "--test-reporter=tap",
            "--test-concurrency=1",
            ...files,
          ],
          app,
          browserEnvironment,
        );

        const summary = requirePassingTap(output);

        for (const field of Object.keys(counts)) {
          counts[field] += summary[field];
        }

        console.log(
          `Browser assertions: ${summary.pass}/${summary.tests} passed; zero skips or cancellations.`,
        );
      }
    } finally {
      server.kill("SIGTERM");
      const timer = setTimeout(() => server.kill("SIGKILL"), 5000);

      await exited;
      clearTimeout(timer);
      process.stdout.write(fixture.redact(serverOutput));
    }

    return { code: 0, counts };
  } finally {
    await rm(temporary, { recursive: true, force: true });
    console.log("Only the task-created browser staging directory was removed.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const mode = process.argv[2]?.slice(2) ?? "all";

    if (process.argv.length > 3 || !["all", "browser-only", "build-only"].includes(mode)) {
      throw new Error("Use no argument, --browser-only, or --build-only.");
    }

    if (mode !== "build-only") {
      await browserPrerequisites();
    }

    await withDisposablePostgres(async (fixture) => {
      console.log(`Applied ${await fixture.prepare()} committed migrations and fixture seed.`);
      await runStagedWorkflow(fixture, mode);
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
