import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import {
  cleanEnvironment,
  sourceIdentity,
} from "../../scripts/engineering/verification-evidence.mjs";

test("a real installed pre-commit gate checks index blobs across compliant, violating and partial commits", () => {
  const root = mkdtempSync(join(tmpdir(), "freemancodz-hook-proof-"));

  const env = {
    ...cleanEnvironment(),
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
  };

  const git = (args, expected = 0) => {
    const result = spawnSync("git", args, { cwd: root, env, encoding: "utf8" });

    assert.equal(result.status, expected, result.stdout + result.stderr);

    return result;
  };

  const write = (file, content) => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), content);
  };

  try {
    for (const file of [
      ".githooks/pre-commit",
      "scripts/engineering/check-staged.mjs",
      "scripts/engineering/check.mjs",
      ".prettierrc.json",
    ]) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      copyFileSync(resolve(file), join(root, file));
    }

    chmodSync(join(root, ".githooks/pre-commit"), 0o755);
    symlinkSync(resolve("node_modules"), join(root, "node_modules"), "dir");
    write("scripts/engineering/baseline.json", '{ "source": [], "format": [] }\n');
    git(["-c", "init.defaultBranch=main", "-c", "init.templateDir=", "init", "--quiet"]);
    git(["config", "user.name", "Engineering fixture"]);
    git(["config", "user.email", "engineering-fixture@example.invalid"]);
    git(["config", "core.hooksPath", ".githooks"]);
    git(["add", ".githooks", "scripts", ".prettierrc.json"]);
    const first = git(["commit", "--quiet", "-m", "Install fixture hook"]);

    assert.match(first.stdout + first.stderr, /Staged formatting: PASS/);
    const before = git(["rev-parse", "HEAD"]).stdout.trim();

    const identity = sourceIdentity(root);

    const hook = readFileSync(join(root, ".githooks/pre-commit"), "utf8");

    assert.ok(identity.files.some((entry) => entry.path === ".githooks/pre-commit"));
    write(".githooks/pre-commit", hook + "# Changed hook must invalidate evidence.\n");
    assert.notEqual(sourceIdentity(root).digest, identity.digest);
    write(".githooks/pre-commit", hook);

    const file = "src/modules/example/fixture.ts";

    write(file, "export const value={bad:1}\n");
    git(["add", file]);
    write(file, "export const value = { bad: 1 };\n");
    const failed = git(
      ["commit", "--quiet", "-m", "Reject staged violation despite clean worktree"],
      1,
    );

    assert.match(failed.stdout + failed.stderr, /STD-004/);
    assert.equal(git(["rev-parse", "HEAD"]).stdout.trim(), before);

    git(["add", file]);
    const passed = git(["commit", "--quiet", "-m", "Commit compliant staged content"]);

    assert.match(passed.stdout + passed.stderr, /Staged formatting: PASS/);

    write(file, "export const value = { bad: 2 };\n");
    git(["add", file]);
    write(file, "export const value={bad:3}\n");
    git(["commit", "--quiet", "-m", "Check index while preserving unrelated unstaged content"]);
    assert.equal(git(["show", `HEAD:${file}`]).stdout, "export const value = { bad: 2 };\n");
    assert.equal(readFileSync(join(root, file), "utf8"), "export const value={bad:3}\n");

    symlinkSync(join(root, "never-created-target"), join(root, "src/modules/example/link.ts"));
    git(["add", "src/modules/example/link.ts"]);
    const symlink = git(["commit", "--quiet", "-m", "Reject staged symlink"], 1);

    assert.match(symlink.stdout + symlink.stderr, /Required regular staged file unavailable/);
    console.log(
      "Real disposable git commit: compliant=0, staged violation=1, clean index/dirty worktree=0, symlink=1; live repository hooks untouched.",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
