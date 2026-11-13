import { access, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import {
  cleanEnvironment,
  completeReport,
  executeStage,
  newReport,
  outsideReportPath,
  runProcess,
  sourceIdentity,
  validateEvidence,
} from "./verification-evidence.mjs";

const root = process.cwd();

const [kind, ...args] = process.argv.slice(2);

try {
  if (kind === "evidence") {
    if (args.length !== 2 || !["quality", "acceptance"].includes(args[0])) {
      throw new Error("Use evidence quality|acceptance /outside/repository/report.json.");
    }

    const report = JSON.parse(await readFile(outsideReportPath(root, args[1]), "utf8"));

    validateEvidence(report, args[0], sourceIdentity(root));
    console.log(`Matching ${args[0]} evidence: PASS.`);
  } else {
    if (
      !["quality", "acceptance"].includes(kind) ||
      (args.length && (args.length !== 2 || args[0] !== "--report"))
    ) {
      throw new Error("Use quality|acceptance [--report /outside/repository/report.json].");
    }

    const target = outsideReportPath(
      root,
      args[1] ?? join(await mkdtemp(join(tmpdir(), "freemancodz-verify-")), `${kind}.json`),
    );

    const report = newReport(kind, sourceIdentity(root));

    const stage = (id, action, options) => executeStage(report, id, action, options);

    const npm = (script, extra = []) =>
      runProcess("npm", ["run", script, ...extra], {
        cwd: root,
        env: {
          ...cleanEnvironment(),
          DATABASE_URL: "postgresql://synthetic@127.0.0.1:1/verification_no_connection",
        },
      });

    let helpers;

    let browser;

    try {
      const ready = await stage(
        "prerequisites",
        async () => {
          const require = createRequire(import.meta.url);

          const semver = require("next/dist/compiled/semver");

          if (!semver.satisfies(process.version, ">=22.13.0 <23")) {
            throw new Error("Repository README requires Node 22.13 or newer in the 22.x series.");
          }

          for (const name of ["next", "prisma", "tsx", "typescript", "eslint", "prettier", "pg"]) {
            const pkg = require(`${name}/package.json`);

            if (pkg.engines?.node && !semver.satisfies(process.version, pkg.engines.node)) {
              throw new Error(`Node does not satisfy installed ${name} runtime requirements.`);
            }
          }

          const socket =
            process.platform === "darwin"
              ? join(homedir(), ".docker/run/docker.sock")
              : "/var/run/docker.sock";

          for (const command of [
            ["info", "--format", "{{.ServerVersion}}"],
            [
              "image",
              "inspect",
              "--format",
              "{{.Id}}",
              "pgvector/pgvector:0.8.1-pg15@sha256:94aee7e88f98125114657cab98e28c5dfa8dd517a6bf83fd98b503439f1e3de6",
            ],
          ]) {
            let result;

            try {
              result = await runProcess("docker", ["--host", `unix://${socket}`, ...command]);
            } catch {
              throw new Error(
                "Local Docker executable is unavailable; required database checks are BLOCKED.",
              );
            }

            if (result.code !== 0) {
              throw Object.assign(
                new Error(
                  "Local Docker or the pinned PostgreSQL image is unavailable; required database checks are BLOCKED.",
                ),
                { exitCode: result.code },
              );
            }
          }

          if (kind === "acceptance") {
            await access(join(root, "src/generated/prisma/client.ts"));
          }

          return { code: 0 };
        },
        { blocked: true },
      );

      if (ready) {
        let generated = true;

        if (kind === "quality") {
          await stage("prisma-validate", () => npm("prisma:validate"));
          generated = await stage("prisma-generate", () => npm("prisma:generate"));
          for (const [id, command, extra] of [
            ["architecture", "check:architecture"],
            ["format", "check:format"],
            ["lint", "lint"],
            ["types", "typecheck", ["--", "--incremental", "false"]],
          ]) {
            await stage(id, () => npm(command, extra));
          }
        }

        if (generated) {
          const loaded = await stage("harness", async () => {
            await import("tsx");
            const imported = await import("../../tests/integration/disposable-postgres.ts");

            helpers = imported.default ?? imported;
            browser = await import("../../tests/e2e/run-workflow.mjs");

            return { code: 0 };
          });

          if (!loaded) {
            throw new Error("Verification harness could not load; see harness stage.");
          }

          if (kind === "quality") {
            await stage("unit", () => npm("test:unit"), { tap: helpers.requirePassingTap });
            await stage("tooling", () => npm("test:engineering"), {
              tap: helpers.requirePassingTap,
            });
          } else {
            const browsersReady = await stage(
              "browser-prerequisites",
              async () => {
                await browser.browserPrerequisites();

                return { code: 0 };
              },
              { blocked: true },
            );

            if (!browsersReady) {
              throw new Error("Required browser prerequisites unavailable.");
            }
          }

          let entered = false;

          try {
            await helpers.withDisposablePostgres(async (fixture) => {
              entered = true;
              report.fixture = {
                id: fixture.environment.FREEMANCODZ_FIXTURE_ID,
                image: helpers.POSTGRES_IMAGE,
                major: 15,
                migrations: 0,
                cleanup: "NOT RUN",
              };
              await stage("database-fixture", async () => ({ code: 0 }));
              const prepared = await stage("migrations", async () => {
                try {
                  report.fixture.migrations = await fixture.prepare();
                } catch (error) {
                  throw new Error(fixture.redact(error.message));
                }

                console.log(
                  `Applied ${report.fixture.migrations} committed migrations and fixture seed.`,
                );

                return { code: 0 };
              });

              if (prepared && kind === "quality") {
                const { runDatabaseSuite } =
                  await import("../../tests/integration/run-database.mjs");

                await stage("database", () => runDatabaseSuite(fixture));
                await stage("production-build", () =>
                  browser.runStagedWorkflow(fixture, "build-only"),
                );
              } else if (prepared) {
                await stage("browser", () => browser.runStagedWorkflow(fixture, "browser-only"));
              }
            });
            report.fixture.cleanup = "PASS";
            await stage("fixture-cleanup", async () => ({ code: 0 }));
          } catch (error) {
            await stage(
              entered ? "fixture-cleanup" : "database-fixture",
              async () => {
                throw error;
              },
              { blocked: !entered },
            );
          }
        }
      }
    } catch (error) {
      if (!report.stages.some((entry) => entry.status === "BLOCKED" || entry.status === "FAIL")) {
        report.error = error.message;
      }

      console.error(`Verification could not finish: ${error.message}`);
    }

    await stage("snapshot", async () => {
      if (JSON.stringify(report.identity) !== JSON.stringify(sourceIdentity(root))) {
        throw new Error(
          "Verification inputs changed during execution; rerun on a stable snapshot.",
        );
      }

      return { code: 0 };
    });
    let code = completeReport(report);

    if (code === 0) {
      try {
        validateEvidence(report, kind, sourceIdentity(root));
      } catch (error) {
        report.overall = "FAIL";
        code = 1;
        console.error(error.message);
      }
    }

    await writeFile(target, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    for (const result of report.stages) {
      console.log(`${result.id}: ${result.status} (exit ${result.exitCode ?? "not executed"})`);
    }

    console.log(`${kind.toUpperCase()}: ${report.overall}. Evidence: ${target}`);
    process.exitCode = code;
  }
} catch (error) {
  console.error(`Verification BLOCKED: ${error.message}`);
  process.exitCode = 1;
}
