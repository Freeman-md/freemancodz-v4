import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export const expectedImage =
  "pgvector/pgvector:0.8.1-pg15@sha256:94aee7e88f98125114657cab98e28c5dfa8dd517a6bf83fd98b503439f1e3de6";

export const stageDefinitions = {
  quality: [
    ["prerequisites", "Node/dependency/Docker image preflight"],
    ["prisma-validate", "npm run prisma:validate"],
    ["prisma-generate", "npm run prisma:generate"],
    ["architecture", "npm run check:architecture"],
    ["format", "npm run check:format"],
    ["lint", "npm run lint"],
    ["types", "npm run typecheck -- --incremental false"],
    ["harness", "Load the existing TSX database and staged-build helpers"],
    ["unit", "npm run test:unit", true],
    ["tooling", "npm run test:engineering", true],
    ["database-fixture", "withDisposablePostgres: provision and verify owned PostgreSQL 15"],
    ["migrations", "DisposableFixture.prepare: committed migrations and fixture seed"],
    [
      "database",
      "runDatabaseSuite: explicit TAP integration suites and unsafe-target control",
      true,
    ],
    [
      "production-build",
      "runStagedWorkflow(build-only): stage production; prisma generate; next build --webpack",
    ],
    ["fixture-cleanup", "withDisposablePostgres: verify owned container and volume removed"],
    ["snapshot", "Verify HEAD and safe worktree inputs unchanged"],
  ],
  acceptance: [
    ["prerequisites", "Node/dependency/generated-client/Docker preflight"],
    ["harness", "Load the existing TSX database and staged-build helpers"],
    ["browser-prerequisites", "Matching installed Playwright Chromium/WebKit engines"],
    ["database-fixture", "withDisposablePostgres: provision and verify owned PostgreSQL 15"],
    ["migrations", "DisposableFixture.prepare: committed migrations and fixture seed"],
    [
      "browser",
      "runStagedWorkflow(browser-only): stage Meeting; prisma generate; next build --webpack; workflow/status and Chromium/WebKit assistant TAP",
      true,
    ],
    ["fixture-cleanup", "withDisposablePostgres: verify owned container and volume removed"],
    ["snapshot", "Verify HEAD and safe worktree inputs unchanged"],
  ],
};

const secretPart =
  /(^\.env|secret|credential|(?:^|[-_.])(?:tokens?|cookies?)(?:[-_.]|$)|private[-_.]?key|^\.(?:aws|ssh|npmrc|netrc)$|\.(?:pem|key|p12|pfx|crt|cer|der|p8)$)/i;

const rootInputs = new Set([
  "AGENTS.md",
  "README.md",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next-env.d.ts",
  "next.config.ts",
  "eslint.config.mjs",
  "postcss.config.mjs",
  "tailwind.config.ts",
  "prisma.config.ts",
  ".gitignore",
  ".prettierignore",
  ".prettierrc.json",
]);

export function identityCandidate(file) {
  const parts = file.split("/");

  return (
    !isAbsolute(file) &&
    !parts.some((part) => part === ".." || secretPart.test(part)) &&
    !/^(?:node_modules|\.next|dist|coverage|src\/generated)(?:\/|$)/.test(file) &&
    !file.startsWith("docs/engineering/setup/") &&
    file !== "docs/engineering/ENGINEERING_SETUP_STATUS.md" &&
    (rootInputs.has(file) ||
      file === ".githooks/pre-commit" ||
      (/^(src|tests|scripts|prisma|docs|\.github)\//.test(file) &&
        /\.(?:[cm]?[jt]s|jsx|tsx|json|md|mdx|css|scss|ya?ml|prisma|sql|toml)$/.test(file)) ||
      (/^public\//.test(file) &&
        /\.(?:html|svg|png|jpe?g|webp|gif|ico|woff2?|zip|txt|xml|json)$/.test(file)) ||
      file === ".agents/skills/nextjs-architecture/SKILL.md") &&
    !/\.(?:tsbuildinfo|log)$/.test(file)
  );
}

export function sourceIdentity(root) {
  const git = (args) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();

  const files = [];

  for (const file of [
    ...new Set(git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"]).split("\0")),
  ]
    .filter(Boolean)
    .sort()) {
    if (!identityCandidate(file)) {
      continue;
    }

    let current = root;

    try {
      for (const part of file.split("/")) {
        current = join(current, part);
        if (lstatSync(current).isSymbolicLink()) {
          throw new Error("Evidence inputs may not follow symlinks.");
        }
      }

      files.push({
        path: file,
        sha256: createHash("sha256").update(readFileSync(current)).digest("hex"),
      });
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  if (!files.length) {
    throw new Error("No safe verification inputs found.");
  }

  return {
    revision: git(["rev-parse", "HEAD"]),
    digest: createHash("sha256")
      .update(files.map((file) => `${file.path}\0${file.sha256}\n`).join(""))
      .digest("hex"),
    files,
    migrationCount: files.filter((file) =>
      /^prisma\/migrations\/\d+_[^/]+\/migration\.sql$/.test(file.path),
    ).length,
  };
}

export function outsideReportPath(root, requested) {
  const target = resolve(requested);

  const parent = realpathSync(dirname(target));

  const actual = join(parent, basename(target));

  const rel = relative(realpathSync(root), actual);

  if (!rel || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))) {
    throw new Error("Evidence must be outside the repository.");
  }

  if ([target, actual].some((file) => file.split("/").some((part) => secretPart.test(part)))) {
    throw new Error("Unsafe evidence path.");
  }

  try {
    if (lstatSync(actual).isSymbolicLink()) {
      throw new Error("Evidence paths may not be symlinks.");
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  return actual;
}

export function cleanEnvironment() {
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    TMPDIR: process.env.TMPDIR,
    LANG: "C.UTF-8",
    NODE_ENV: "development",
    NEXT_TELEMETRY_DISABLED: "1",
  };
}

export function runProcess(
  binary,
  args,
  { cwd, env = cleanEnvironment(), timeout = 300_000 } = {},
) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(binary, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });

    let output = "";

    const timer = setTimeout(() => child.kill("SIGKILL"), timeout);

    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", () => {
      clearTimeout(timer);
      reject(new Error("Required child process could not start."));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolveResult({
        code: code ?? 1,
        output: output.replace(/postgres(?:ql)?:\/\/[^\s'"<>]+/gi, "[database URL redacted]"),
      });
    });
  });
}

export function passingCounts(counts) {
  return (
    record(counts) &&
    Object.keys(counts).sort().join(",") === "cancelled,fail,pass,skipped,tests" &&
    Object.values(counts).every((n) => Number.isSafeInteger(n) && n >= 0) &&
    counts.tests > 0 &&
    counts.pass === counts.tests &&
    counts.fail === 0 &&
    counts.skipped === 0 &&
    counts.cancelled === 0
  );
}

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function canonicalTimestamp(value) {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

function validRuntime(runtime) {
  if (
    !record(runtime) ||
    typeof runtime.node !== "string" ||
    typeof runtime.platform !== "string" ||
    typeof runtime.arch !== "string"
  ) {
    return false;
  }

  const version = /^v22\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(runtime.node);

  // Preserve the README's Node 22.13+ requirement and nonempty scalar producer identifiers.
  return (
    version !== null &&
    Number.isSafeInteger(Number(version[1])) &&
    Number(version[1]) >= 13 &&
    Number.isSafeInteger(Number(version[2])) &&
    /^[a-z][a-z0-9]*$/.test(runtime.platform) &&
    /^[a-z][a-z0-9]*$/.test(runtime.arch)
  );
}

export function newReport(kind, identity) {
  if (!stageDefinitions[kind]) {
    throw new Error("Unknown verification kind.");
  }

  return {
    version: 1,
    kind,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    identity,
    fixture: null,
    stages: stageDefinitions[kind].map(([id, command]) => ({
      id,
      command,
      status: "NOT RUN",
      exitCode: null,
      counts: null,
      reason: "Not executed.",
    })),
    overall: "BLOCKED",
    error: null,
  };
}

export async function executeStage(report, id, action, { blocked = false, tap } = {}) {
  const stage = report.stages.find((entry) => entry.id === id);

  if (!stage || stage.status !== "NOT RUN") {
    throw new Error("Unknown or repeated verification stage.");
  }

  console.log(`[${id}] ${stage.command}`);
  try {
    const result = await action();

    stage.exitCode = result.code;
    if (result.output) {
      process.stdout.write(result.output);
    }

    if (result.code !== 0) {
      throw new Error("Command returned nonzero; see safe diagnostics above.");
    }

    stage.counts = result.counts ?? (tap ? tap(result.output) : null);
    if (
      stageDefinitions[report.kind].find(([name]) => name === id)[2] &&
      !passingCounts(stage.counts)
    ) {
      throw new Error("Required tests have missing, zero, failed, skipped or cancelled counts.");
    }

    stage.status = "PASS";
    stage.reason = null;
  } catch (error) {
    if (Number.isInteger(error.exitCode)) {
      stage.exitCode = error.exitCode;
    }

    stage.status = blocked ? "BLOCKED" : "FAIL";
    stage.reason = error.message;
  }

  console.log(
    `[${id}] ${stage.status}${stage.exitCode === null ? "" : ` (exit ${stage.exitCode})`}${stage.reason ? `: ${stage.reason}` : ""}`,
  );

  return stage.status === "PASS";
}

export function completeReport(report) {
  report.finishedAt = new Date().toISOString();
  report.overall = report.error
    ? "FAIL"
    : report.stages.every((stage) => stage.status === "PASS")
      ? "PASS"
      : report.stages.some((stage) => stage.status === "FAIL")
        ? "FAIL"
        : "BLOCKED";

  return report.overall === "PASS" ? 0 : 1;
}

export function validateEvidence(report, expectedKind, identity) {
  const definitions = stageDefinitions[expectedKind];

  if (
    !definitions ||
    !record(report) ||
    report?.version !== 1 ||
    report.kind !== expectedKind ||
    report.overall !== "PASS" ||
    report.error !== null ||
    !Array.isArray(report.stages) ||
    report.stages.length !== definitions.length
  ) {
    throw new Error("Evidence is malformed, incomplete or not PASS.");
  }

  if (
    !canonicalTimestamp(report.startedAt) ||
    !canonicalTimestamp(report.finishedAt) ||
    Date.parse(report.finishedAt) < Date.parse(report.startedAt) ||
    !validRuntime(report.runtime)
  ) {
    throw new Error("Missing or invalid evidence execution context.");
  }

  if (JSON.stringify(report.identity) !== JSON.stringify(identity)) {
    throw new Error("Evidence does not match the current revision and safe worktree inputs.");
  }

  if (
    !record(report.fixture) ||
    typeof report.fixture.id !== "string" ||
    !/^freemancodz_fixture_[a-f0-9]{24}$/.test(report.fixture.id) ||
    report.fixture.major !== 15 ||
    !Number.isSafeInteger(report.fixture.migrations) ||
    report.fixture.migrations < 1 ||
    report.fixture.migrations !== identity.migrationCount ||
    report.fixture.cleanup !== "PASS" ||
    report.fixture.image !== expectedImage
  ) {
    throw new Error("Missing verified disposable fixture identity or cleanup.");
  }

  definitions.forEach(([id, command, tests], index) => {
    const stage = report.stages[index];

    if (
      !record(stage) ||
      stage.id !== id ||
      stage.command !== command ||
      stage.status !== "PASS" ||
      stage.exitCode !== 0 ||
      stage.reason !== null ||
      (tests ? !passingCounts(stage.counts) : stage.counts !== null)
    ) {
      throw new Error(`Required evidence stage is invalid: ${id}.`);
    }
  });

  return true;
}
