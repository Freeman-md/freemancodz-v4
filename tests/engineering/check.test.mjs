import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  compareBaseline,
  worktreeExists,
  main,
  safeCandidate,
  scanFormat,
  scanSource,
} from "../../scripts/engineering/check.mjs";

const checkUrl = new URL("../../scripts/engineering/check.mjs", import.meta.url).href;

const calendar = "src/infrastructure/google-calendar/types.ts";

const meeting = "src/modules/meeting/types.ts";

const consumer = "src/modules/assistant/service.ts";

const inertCalendar =
  'export class CalendarAvailabilityError extends Error { constructor(cause?: unknown, readonly category: "provider" | "network" = "provider") { super("Unavailable", { cause }); } }';

const inertMeeting =
  'export class MeetingBookingError extends Error { constructor(readonly code: "unavailable" | "conflict", cause?: unknown) { super("Unavailable", { cause }); } }';

const scan = (files) => scanSource(new Map(Object.entries(files)));

const rule = (files, expected) =>
  assert.ok(
    scan(files).some((finding) => finding.rule === expected),
    `Expected ${expected}`,
  );

function childScan(files) {
  const program = `import { scanSource, printResult } from ${JSON.stringify(checkUrl)}; const findings = scanSource(new Map(${JSON.stringify(Object.entries(files))})); process.exitCode = printResult(findings, findings.length, 'Fixture');`;

  return spawnSync(process.execPath, ["--input-type=module", "-e", program], { encoding: "utf8" });
}

test("compliant owned code, type ports, public types and inert errors pass without uniform layers", () => {
  const files = {
    [consumer]:
      'import { local } from "./local"; import type { Port } from "@/infrastructure/openai/types"; import type { Meeting } from "../meeting/types"; import { CalendarAvailabilityError } from "@/infrastructure/google-calendar/types"; import { MeetingBookingError } from "../meeting/types";',
    "src/modules/assistant/local.ts": "export function local() { return 1; }",
    "src/infrastructure/openai/types.ts": "export type Port = { run(): void };",
    [calendar]: inertCalendar,
    [meeting]: inertMeeting + " export type Meeting = { id: string };",
    "src/modules/composition.ts": 'import { createClient } from "@/infrastructure/openai/client";',
    "src/infrastructure/openai/client.ts":
      'import OpenAI from "openai"; export const createClient = () => new OpenAI();',
    "src/app/page.tsx": 'import { client } from "@/modules/composition";',
  };

  assert.deepEqual(scan(files), []);
  const child = childScan(files);

  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /PASS/);
  console.log("Fixture process: compliant = exit 0");
});

for (const syntax of [
  'import { x } from "@/app/example";',
  'import { x } from "../../app/example";',
  'export { x as y } from "../../app/example";',
  'export * from "../../app/example";',
  'import {} from "../../app/example";',
  'export {} from "../../app/example";',
  'const x = import("../../app/example");',
  'const x = require("../../app/example");',
  'type X = import("../../app/example").X;',
]) {
  test(`forbidden module direction resolves ${syntax}`, () => {
    rule(
      { [consumer]: syntax, "src/app/example.ts": "export const x = 1; export type X = string;" },
      "ARC-003",
    );
  });
}

test("infrastructure business runtime edges and improper composition consumers fail", () => {
  rule(
    {
      "src/infrastructure/client.ts": 'import { service } from "../modules/assistant/service";',
      [consumer]: "export const service = 1;",
    },
    "ARC-003",
  );
  rule(
    {
      [consumer]: 'import { service } from "../composition";',
      "src/modules/composition.ts": "export const service = 1;",
    },
    "ARC-003",
  );
});

test("private module helpers and runtime client imports fail; explicit technical types pass", () => {
  const target = "src/infrastructure/resend/client.ts";

  const files = {
    [consumer]: 'import { ResendClientError } from "@/infrastructure/resend/client";',
    [target]: "export class ResendClientError extends Error {}",
  };

  rule(files, "ARC-006");
  assert.deepEqual(
    scan({
      ...files,
      [consumer]: 'import type { ResendClientError } from "@/infrastructure/resend/client";',
    }),
    [],
  );
  rule(
    {
      [consumer]: 'import { helper } from "../meeting/helper";',
      "src/modules/meeting/helper.ts": "export const helper = () => 1;",
    },
    "ARC-007",
  );
  const child = childScan(files);

  assert.equal(child.status, 1);
  assert.match(child.stderr, /ARC-006.*src\/modules\/assistant\/service.ts:1/);
  console.log("Fixture process: runtime client import = exit 1, ARC-006 diagnostic");
});

test("inline type bindings remain distinct from value and duplicate bindings", () => {
  const target = "src/modules/meeting/service.ts";

  const files = {
    [consumer]: 'import { type Port, run, run as retry } from "../meeting/service";',
    [target]: "export type Port = {}; export const run = () => 1;",
  };

  const findings = scan(files);

  assert.equal(findings.length, 2);
  assert.deepEqual(
    findings.map((f) => [f.imported, f.local]),
    [
      ["run", "run"],
      ["run", "retry"],
    ],
  );
});

test("D2 rejects altered inert files, runtime graphs, constructors, exports and unbounded codes", () => {
  for (const corrupted of [
    inertCalendar + " export const client = new Client();",
    inertCalendar + ' import "server-only";',
    inertCalendar.replace(
      'super("Unavailable", { cause });',
      'fetch("https://example.invalid"); super("Unavailable", { cause });',
    ),
    inertCalendar.replace(
      'super("Unavailable", { cause });',
      "super(process.env.VALUE, { cause });",
    ),
    inertCalendar.replace('"provider" | "network"', "string"),
    inertCalendar + " export function helper() {}",
    "export class CalendarAvailabilityError extends Error {}",
    inertCalendar.replace("constructor(", "static value = run(); constructor("),
  ]) {
    rule(
      {
        [consumer]:
          'import { CalendarAvailabilityError } from "@/infrastructure/google-calendar/types";',
        [calendar]: corrupted,
      },
      "ARC-006",
    );
  }

  rule(
    {
      [consumer]:
        'import { CalendarAvailabilityError } from "@/infrastructure/google-calendar/types";',
      [calendar]: inertCalendar + ' import { MeetingBookingError } from "@/modules/meeting/types";',
      [meeting]: inertMeeting + " export const provider = run();",
    },
    "ARC-006",
  );
  rule(
    {
      [consumer]: 'import { helper } from "@/infrastructure/google-calendar/types";',
      [calendar]: inertCalendar,
    },
    "ARC-006",
  );
});

test("adapter concrete infrastructure/repository imports fail while central getters pass", () => {
  for (const target of [
    "src/infrastructure/database/prisma.ts",
    "src/infrastructure/openai/client.ts",
    "src/modules/meeting/repository.ts",
  ]) {
    rule(
      {
        "src/app/api/demo/route.ts": `import { x } from "@/${target.slice(4, -3)}";`,
        [target]: "export const x = 1;",
      },
      "ARC-002",
    );
  }

  assert.deepEqual(
    scan({
      "src/app/api/demo/route.ts": 'import { getValue } from "@/infrastructure/config/env";',
      "src/infrastructure/config/env.ts": "export const getValue = () => process.env.VALUE;",
    }),
    [],
  );
});

test("browser transitives include re-exports and static dynamic imports", () => {
  for (const link of ['export { x } from "./bridge";', 'const x = import("./bridge");']) {
    rule(
      {
        "src/app/_demo/Panel.tsx": '"use client"; import "./helper";',
        "src/app/_demo/helper.ts": link,
        "src/app/_demo/bridge.ts": 'import { x } from "@/infrastructure/client";',
        "src/infrastructure/client.ts": "export const x = 1;",
      },
      "ARC-004",
    );
  }

  rule(
    {
      "src/app/_demo/Panel.tsx":
        '"use client"; import type { Private } from "@/modules/meeting/types";',
      [meeting]: "export type Private = {};",
    },
    "ARC-004",
  );
});

for (const expression of [
  "process.env.VALUE",
  'process["env"]["VALUE"]',
  "globalThis.process.env.VALUE",
  "process.env[key]",
  "const values = process.env",
  "const { VALUE } = process.env",
]) {
  test(`direct configuration rejects ${expression}`, () => {
    rule({ "src/app/api/demo/route.ts": expression + ";" }, "ARC-009");
  });
}

test("dotenv belongs only to the infrastructure target loader; central env and subprocess forwarding pass", () => {
  rule(
    { "src/entrypoints/demo.ts": 'import { config as load } from "dotenv"; load();' },
    "ARC-009",
  );
  rule({ "src/app/api/demo/route.ts": 'await import("dotenv/config");' }, "ARC-009");
  assert.deepEqual(
    scan({
      "src/infrastructure/config/portfolio-database.ts":
        'const { config } = await import("dotenv"); verifyPortfolioTarget("development", {}, process.env);',
      "src/entrypoints/demo.ts":
        'import { spawnSync } from "node:child_process"; spawnSync("node", [], { env: { ...process.env, DATABASE_URL: connection } });',
    }),
    [],
  );
  rule({ "src/entrypoints/demo.ts": "const copied = { ...process.env };" }, "ARC-009");
});

test("new suppressions and parallel source roots fail without scanning strings", () => {
  rule({ [consumer]: "// eslint-disable-next-line no-unused-vars\nconst x = 1;" }, "STD-024");
  rule({ "src/server/db.ts": "export const x = 1;" }, "ARC-002");
  assert.deepEqual(scan({ [consumer]: 'const text = "eslint-disable";' }), []);
});

test("parse failure, unresolved and unsupported imports are errors, not empty successful scans", async () => {
  for (const code of [
    "const x = ;",
    'import { x } from "./missing";',
    "const x = import(target);",
    'import x = require("thing");',
    'import "#internal";',
    'import "file:///uninspected.ts";',
  ]) {
    assert.throws(() => scan({ [consumer]: code }), /SCAN:/);
  }

  await assert.rejects(main(["all"]), /supported mode/);
  const child = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("../../scripts/engineering/check.mjs", import.meta.url)), "unsupported"],
    { encoding: "utf8" },
  );

  assert.equal(child.status, 2);
  assert.match(child.stderr, /supported mode/);
  console.log("Fixture process: unsupported mode = exit 2");
});

test("baseline matches exact syntax, symbol, binding and count; new, increased and stale fail", () => {
  const finding = {
    rule: "ARC-007",
    file: consumer,
    kind: "import",
    target: meeting,
    imported: "run",
    local: "run",
    typeOnly: false,
    syntax: "import",
    line: 1,
    hint: "fix",
  };

  const { line, hint, ...identity } = finding;

  const baseline = [{ ...identity, id: "GAP-test", count: 1 }];

  assert.deepEqual(compareBaseline([finding], baseline), []);
  for (const findings of [
    [],
    [finding, finding],
    [{ ...finding, local: "alias" }],
    [{ ...finding, syntax: "export" }],
    [{ ...finding, target: "src/modules/other/service.ts" }],
  ]) {
    assert.ok(compareBaseline(findings, baseline).length);
  }

  assert.throws(
    () => compareBaseline([finding], [{ ...baseline[0], count: 2 }]),
    /single occurrences/,
  );
});

test("formatter candidates reject sensitive/build paths before content access and include ordinary docs", () => {
  for (const file of [
    ".env",
    ".env.local",
    ".envrc",
    "tokens.json",
    "docs/cookies.json",
    "docs/secrets.md",
    "credentials.json",
    "src/generated/prisma/client.ts",
    "node_modules/pkg/index.js",
    "../outside.md",
  ]) {
    assert.equal(safeCandidate(file), false, file);
  }

  for (const file of [
    "docs/new-guide.md",
    "scripts/engineering/check.mjs",
    "src/app/page.tsx",
    "AGENTS.md",
    ".prettierrc.json",
  ]) {
    assert.equal(safeCandidate(file), true, file);
  }
});

test("formatter fails changed/new/stale hashes, parse errors and symlinks; never reads excluded secrets", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "engineering-format-"));

  try {
    writeFileSync(path.join(root, ".prettierrc.json"), '{"semi":true}\n');
    writeFileSync(path.join(root, "example.js"), "const value=1");
    const initial = await scanFormat(root, ["example.js"], []);

    assert.equal(initial.failures.length, 1);
    const program = `import { scanFormat, printResult } from ${JSON.stringify(checkUrl)}; const result = await scanFormat(${JSON.stringify(root)}, ['example.js'], []); process.exitCode = printResult(result.failures, result.findings.length, 'Formatter fixture');`;

    const failed = spawnSync(process.execPath, ["--input-type=module", "-e", program], {
      encoding: "utf8",
    });

    assert.equal(failed.status, 1);
    assert.match(failed.stderr, /STD-004/);
    console.log("Fixture process: STD-004 formatting violation = exit 1");
    const baseline = [{ ...initial.findings[0], id: "GAP-test", count: 1 }];

    assert.equal((await scanFormat(root, ["example.js"], baseline)).failures.length, 0);
    writeFileSync(path.join(root, "example.js"), "const value=2");
    assert.equal((await scanFormat(root, ["example.js"], baseline)).failures.length, 2);
    writeFileSync(path.join(root, "example.js"), "const value = 1;\n");
    const passed = spawnSync(process.execPath, ["--input-type=module", "-e", program], {
      encoding: "utf8",
    });

    assert.equal(passed.status, 0, passed.stderr);
    console.log("Fixture process: formatted file = exit 0");
    assert.match((await scanFormat(root, ["example.js"], baseline)).failures[0].hint, /STALE/);
    writeFileSync(path.join(root, "example.js"), "const = ;");
    await assert.rejects(scanFormat(root, ["example.js"], []));
    // A dangling sensitive-path link proves filtering occurs without opening its target.
    symlinkSync("unreadable-and-nonexistent", path.join(root, ".env.local"));
    await assert.rejects(scanFormat(root, [".env.local"], []), /unsafe/);
    mkdirSync(path.join(root, "docs"));
    symlinkSync("../.env.local", path.join(root, "docs/guide.md"));
    await assert.rejects(scanFormat(root, ["docs/guide.md"], []), /symlink/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ES module extensions and emitted .js spellings retain ownership checks", () => {
  for (const [specifier, target] of [
    ["../../app/example.mjs", "src/app/example.mts"],
    ["../../app/example.cjs", "src/app/example.cts"],
    ["../../app/example.js", "src/app/example.ts"],
    ["../../app/example", "src/app/example/index.ts"],
  ]) {
    rule(
      {
        "src/modules/demo/service.mts": `import { x } from "${specifier}";`,
        [target]: "export const x = 1;",
      },
      "ARC-003",
    );
  }
});

test("browser code cannot consume obvious Node built-ins", () => {
  for (const specifier of ["node:fs", "fs", "node:child_process", "node:process"]) {
    rule(
      { "src/app/_demo/Panel.tsx": `"use client"; import * as platform from "${specifier}";` },
      "ARC-004",
    );
  }
});

test("node:process named env, default and namespace aliases cannot hide direct configuration", () => {
  for (const code of [
    'import { env as settings } from "node:process";',
    'import processAlias from "node:process"; const x = processAlias["env"]["VALUE"];',
    'import * as platform from "process"; const x = platform.env[key];',
  ]) {
    rule({ "src/app/api/demo/route.ts": code }, "ARC-009");
  }
});

test("deleted worktree candidates are absent while stale baseline entries remain failures", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "engineering-deletion-"));

  try {
    writeFileSync(path.join(root, "guide.md"), "# Guide\n");
    assert.equal(worktreeExists(root, "guide.md"), true);
    rmSync(path.join(root, "guide.md"));
    assert.equal(worktreeExists(root, "guide.md"), false);
    assert.equal(
      compareBaseline(
        [],
        [{ rule: "STD-004", file: "guide.md", sha256: "old", id: "GAP-test", count: 1 }],
      ).length,
      1,
    );
    assert.deepEqual(compareBaseline([], []), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("each source detector produces a real non-zero process exit and rule-specific diagnostics", () => {
  const cases = [
    ["ARC-002", { "src/server/example.ts": "export const x = 1;" }],
    ["ARC-003", { [consumer]: 'import "../../app/example";', "src/app/example.ts": "export {};" }],
    ["ARC-004", { "src/app/_demo/Panel.tsx": '"use client"; import "node:fs";' }],
    [
      "ARC-006",
      {
        [consumer]: 'import { Client } from "@/infrastructure/client";',
        "src/infrastructure/client.ts": "export class Client {}",
      },
    ],
    [
      "ARC-007",
      {
        [consumer]: 'import { helper } from "../meeting/helper";',
        "src/modules/meeting/helper.ts": "export const helper = 1;",
      },
    ],
    ["ARC-009", { "src/app/api/demo/route.ts": "const value = process.env.VALUE;" }],
    ["STD-024", { [consumer]: "// @ts-nocheck\nexport {};" }],
  ];

  for (const [expected, files] of cases) {
    const child = childScan(files);

    assert.equal(child.status, 1, child.stderr);
    assert.match(child.stderr, new RegExp(expected));
    console.log(`Fixture process: ${expected} = exit 1`);
  }
});

test("a second dotenv call cannot reuse the original loader baseline", () => {
  const file = "src/entrypoints/maintenance/demo.ts";

  const one = scan({ [file]: 'import { config } from "dotenv"; function run() { config(); }' });

  const entry = { ...one[0], id: "GAP-test", count: 1 };

  assert.deepEqual(compareBaseline(one, [entry]), []);
  const two = scan({
    [file]: 'import { config } from "dotenv"; function run() { config(); config(); }',
  });

  assert.ok(compareBaseline(two, [entry]).length);
});

test("adapter runtime repository/service imports include relative plural and suffixed paths", () => {
  for (const target of [
    "src/modules/portfolio/repositories/public-portfolio.repository.ts",
    "src/modules/portfolio/services/public-portfolio.service.ts",
    "src/modules/portfolio/public-portfolio.repository.ts",
    "src/modules/portfolio/public-portfolio.service.ts",
  ]) {
    for (const file of ["src/app/page.tsx", "src/entrypoints/maintenance/job.ts"]) {
      const specifier = path.posix.relative(path.posix.dirname(file), target).replace(/\.ts$/, "");

      const files = {
        [file]: `import { Implementation } from "${specifier}";`,
        [target]: "export class Implementation {}",
      };

      rule(files, "ARC-002");
      assert.deepEqual(
        scan({ ...files, [file]: `import type { Implementation } from "${specifier}";` }),
        [],
      );
    }
  }

  assert.deepEqual(
    scan({
      "src/app/page.tsx":
        'import { technologyLabels } from "../modules/portfolio/data/technology-labels";',
      "src/modules/portfolio/data/technology-labels.ts": "export const technologyLabels = {};",
      "src/modules/composition.ts":
        'import { Repository } from "./portfolio/repositories/public-portfolio.repository";',
      "src/modules/portfolio/repositories/public-portfolio.repository.ts":
        "export class Repository {}",
    }),
    [],
  );
});

test("suppression detection distinguishes JSX/template raw text from actual comments", () => {
  const file = "src/app/_demo/Panel.tsx";

  for (const code of [
    "export const Panel = () => <div>// eslint-disable-next-line no-console</div>;",
    "const text = `value ${value} // eslint-disable-next-line no-console`;",
    "const text = `// eslint-disable ${value} /* @ts-ignore */`;",
    'const text = "/* eslint-disable */";',
    "// Mentioning eslint-disable in an explanation is not a directive.\nexport {};",
  ]) {
    assert.deepEqual(scan({ [file]: code }), [], code);
  }

  for (const code of [
    "export const Panel = () => <div>{/* eslint-disable */}</div>;",
    "const text = `value ${ /* eslint-disable */ value }`;",
    "// eslint-disable\nexport {};",
    "export {}; // eslint-disable",
    "const value = /* @ts-ignore */ 1;",
    "export {};\n// eslint-disable",
  ]) {
    rule({ [file]: code }, "STD-024");
  }
});
