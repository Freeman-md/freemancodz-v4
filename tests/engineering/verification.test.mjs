import assert from "node:assert/strict";
import { mkdtemp, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  cleanEnvironment,
  completeReport,
  executeStage,
  expectedImage,
  identityCandidate,
  newReport,
  outsideReportPath,
  passingCounts,
  runProcess,
  stageDefinitions,
  validateEvidence,
} from "../../scripts/engineering/verification-evidence.mjs";

const identity = {
  revision: "a".repeat(40),
  digest: "b".repeat(64),
  files: [{ path: "package.json", sha256: "c".repeat(64) }],
  migrationCount: 23,
};

const counts = { tests: 3, pass: 3, fail: 0, skipped: 0, cancelled: 0 };

function completeFixture(kind = "quality") {
  const report = newReport(kind, identity);

  report.fixture = {
    id: `freemancodz_fixture_${"a".repeat(24)}`,
    image: expectedImage,
    major: 15,
    migrations: 23,
    cleanup: "PASS",
  };
  report.stages.forEach((stage, index) =>
    Object.assign(stage, {
      status: "PASS",
      exitCode: 0,
      reason: null,
      counts: stageDefinitions[kind][index][2] ? { ...counts } : null,
    }),
  );
  completeReport(report);

  return report;
}

test("evidence accepts complete matching quality and acceptance and rejects malformed required stages", () => {
  for (const kind of ["quality", "acceptance"]) {
    assert.equal(validateEvidence(completeFixture(kind), kind, identity), true);
  }

  for (const mutate of [
    (r) => {
      r.version = 2;
    },
    (r) => {
      r.stages.pop();
    },
    (r) => {
      r.stages.push(r.stages[0]);
    },
    (r) => {
      r.stages[1] = r.stages[0];
    },
    (r) => {
      r.stages[0].status = "NOT RUN";
    },
    (r) => {
      r.stages[0].command = "true";
    },
    (r) => {
      r.stages[0].exitCode = "0";
    },
    (r) => {
      r.finishedAt = null;
    },
    (r) => {
      r.fixture.cleanup = "NOT RUN";
    },
    (r) => {
      r.fixture.image = expectedImage.replace("94aee", "00000");
    },
    (r) => {
      r.fixture.migrations = "23";
    },
    (r) => {
      r.fixture.migrations = 22;
    },
  ]) {
    const report = completeFixture();

    mutate(report);
    assert.throws(() => validateEvidence(report, "quality", identity));
  }
});

test("evidence rejects stale revision, changed content and missing or skipped test counts", () => {
  for (const changed of [
    { ...identity, revision: "d".repeat(40) },
    { ...identity, digest: "e".repeat(64) },
  ]) {
    assert.throws(() => validateEvidence(completeFixture(), "quality", changed), /does not match/);
  }

  for (const invalid of [
    null,
    { ...counts, tests: 0, pass: 0 },
    { ...counts, pass: 2 },
    { ...counts, skipped: 1 },
    { ...counts, cancelled: 1 },
    { ...counts, fail: 1 },
  ]) {
    assert.ok(!passingCounts(invalid));
    const report = completeFixture();

    report.stages.find((s) => s.id === "unit").counts = invalid;
    assert.throws(() => validateEvidence(report, "quality", identity));
  }
});

test("R14-01 evidence rejects coerced runtime and fixture metadata while preserving producer values", () => {
  for (const runtime of [
    { node: "v22.13.0", platform: "linux", arch: "x64" },
    { node: "v22.17.0", platform: "darwin", arch: "arm64" },
  ]) {
    const report = completeFixture();

    report.runtime = runtime;
    assert.equal(validateEvidence(report, "quality", identity), true);
  }

  for (const mutate of [
    (r) => {
      r.runtime = { node: { invalid: true }, platform: 42, arch: ["arm64"] };
    },
    (r) => {
      r.runtime = [];
    },
    (r) => {
      r.runtime.node = ["v22.17.0"];
    },
    (r) => {
      r.runtime.node = "v26.5.0";
    },
    (r) => {
      r.runtime.node = "v22.12.0";
    },
    (r) => {
      r.runtime.node = "v22.013.0";
    },
    (r) => {
      r.runtime.platform = {};
    },
    (r) => {
      r.runtime.platform = "linux darwin";
    },
    (r) => {
      r.runtime.arch = ["arm64"];
    },
    (r) => {
      r.runtime.arch = "";
    },
    (r) => {
      r.fixture.id = [r.fixture.id];
    },
    (r) => {
      r.fixture = [];
    },
    (r) => {
      r.stages[0] = null;
    },
    (r) => {
      r.stages[0] = [];
    },
  ]) {
    const report = completeFixture();

    mutate(report);
    assert.throws(() => validateEvidence(report, "quality", identity));
  }
});

test("R14-01 evidence requires ordered canonical ISO timestamp strings", () => {
  const valid = completeFixture();

  valid.startedAt = "2026-11-13T10:00:00.000Z";
  valid.finishedAt = "2026-11-13T10:00:00.001Z";
  assert.equal(validateEvidence(valid, "quality", identity), true);
  for (const [start, end] of [
    [0, 1],
    [[valid.startedAt], valid.finishedAt],
    [valid.startedAt, { invalid: true }],
    ["2026-11-13", valid.finishedAt],
    ["2026-11-13T10:00:00+00:00", valid.finishedAt],
    ["2026-02-31T10:00:00.000Z", valid.finishedAt],
    [valid.finishedAt, valid.startedAt],
  ]) {
    const report = completeFixture();

    report.startedAt = start;
    report.finishedAt = end;
    assert.throws(() => validateEvidence(report, "quality", identity), /execution context/);
  }
});

test("a real required child failure preserves exit 7 and produces nonzero overall result", async () => {
  const report = completeFixture();

  Object.assign(
    report.stages.find((s) => s.id === "lint"),
    { status: "NOT RUN", exitCode: null },
  );
  assert.equal(
    await executeStage(report, "lint", () =>
      runProcess(process.execPath, [
        "-e",
        "process.stderr.write('controlled required-stage failure\\n'); process.exit(7)",
      ]),
    ),
    false,
  );
  assert.equal(report.stages.find((s) => s.id === "lint").exitCode, 7);
  assert.equal(completeReport(report), 1);
  assert.equal(report.overall, "FAIL");
});

test("missing and incomplete required checks cannot become overall PASS", async () => {
  const report = newReport("quality", identity);

  await executeStage(
    report,
    "prerequisites",
    async () => {
      throw new Error("Docker unavailable.");
    },
    { blocked: true },
  );
  assert.equal(completeReport(report), 1);
  assert.equal(report.overall, "BLOCKED");
  assert.throws(() => validateEvidence(report, "quality", identity));
  const unexpected = completeFixture();

  unexpected.error = "Unexpected harness error.";
  assert.equal(completeReport(unexpected), 1);
  assert.equal(unexpected.overall, "FAIL");
});

test("supported delayed TSX loading exposes both existing runners without starting services", async () => {
  const result = await runProcess(process.execPath, [
    "--conditions=react-server",
    "--input-type=module",
    "-e",
    `await import('tsx');
     const imported = await import('./tests/integration/disposable-postgres.ts');
     const helpers = imported.default ?? imported;
     const db = await import('./tests/integration/run-database.mjs');
     const browser = await import('./tests/e2e/run-workflow.mjs');
     if (typeof helpers.withDisposablePostgres !== 'function' || typeof db.runDatabaseSuite !== 'function' || typeof browser.runStagedWorkflow !== 'function') process.exit(1);`,
  ]);

  assert.equal(result.code, 0, result.output);
});

test("an isolated orchestration process exits nonzero for a deliberately failed required child", async () => {
  const result = await runProcess(process.execPath, [
    "--input-type=module",
    "-e",
    `
    import { newReport, executeStage, completeReport, runProcess } from './scripts/engineering/verification-evidence.mjs';
    const report = newReport('quality', ${JSON.stringify(identity)});
    await executeStage(report, 'lint', () => runProcess(process.execPath, ['-e', 'process.exit(7)']));
    process.exitCode = completeReport(report);
    console.log('CONTROLLED OVERALL: ' + report.overall);
  `,
  ]);

  assert.equal(result.code, 1);
  assert.match(result.output, /\[lint\] FAIL \(exit 7\)/);
  assert.match(result.output, /CONTROLLED OVERALL: FAIL/);
});

test("identity selection excludes secret names and arbitrary root configuration before reads", () => {
  for (const file of [
    ".env",
    ".env.local",
    ".env.example",
    ".npmrc",
    ".netrc",
    ".git-credentials",
    "arbitrary-config",
    "public/client.pem",
    "public/client.crt",
    "src/credentials.ts",
    "src/generated/prisma/client.ts",
    "docs/engineering/setup/evidence/result.json",
  ]) {
    assert.equal(identityCandidate(file), false, file);
  }

  for (const file of [
    "package-lock.json",
    "AGENTS.md",
    "src/modules/workflow/service.ts",
    "prisma/migrations/123_example/migration.sql",
    "public/images/logo.svg",
    "docs/architecture/ARCHITECTURE.md",
    ".github/workflows/quality.yml",
    ".githooks/pre-commit",
  ]) {
    assert.equal(identityCandidate(file), true, file);
  }
});

test("receipt path rejects in-tree ..prefix and final symlinks without reading targets", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "freemancodz-evidence-test-"));

  try {
    assert.throws(
      () => outsideReportPath(process.cwd(), join(process.cwd(), "..evidence")),
      /outside/,
    );
    const link = join(temporary, "receipt.json");

    await symlink(join(temporary, "never-created-target"), link);
    assert.throws(() => outsideReportPath(process.cwd(), link), /symlinks/);
    assert.equal(
      outsideReportPath(process.cwd(), join(temporary, "valid.json")),
      join(await realpath(temporary), "valid.json"),
    );
  } finally {
    await rm(temporary, { recursive: true });
  }
});

test("canonical CLI records missing Docker as BLOCKED and leaves database stages NOT RUN", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "freemancodz-no-docker-"));

  try {
    const reportPath = join(temporary, "quality.json");

    const result = await runProcess(
      process.execPath,
      [
        "--conditions=react-server",
        "scripts/engineering/verify.mjs",
        "quality",
        "--report",
        reportPath,
      ],
      { env: { ...cleanEnvironment(), PATH: temporary } },
    );

    assert.equal(result.code, 1);
    // Git is also required to establish the snapshot; make it available without Docker.
    if (!result.output.includes("Evidence:")) {
      const { execFileSync } = await import("node:child_process");

      const git = execFileSync("which", ["git"], { encoding: "utf8" }).trim();

      await symlink(git, join(temporary, "git"));
      const retry = await runProcess(
        process.execPath,
        [
          "--conditions=react-server",
          "scripts/engineering/verify.mjs",
          "quality",
          "--report",
          reportPath,
        ],
        { env: { ...cleanEnvironment(), PATH: temporary } },
      );

      assert.equal(retry.code, 1);
      assert.match(retry.output, /prerequisites: BLOCKED/);
    }

    const report = JSON.parse(await readFile(reportPath, "utf8"));

    assert.equal(report.overall, "BLOCKED");
    assert.equal(report.stages.find((s) => s.id === "database").status, "NOT RUN");
  } finally {
    await rm(temporary, { recursive: true });
  }
});
