import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import prettier from "prettier";
import { compareBaseline, printResult, safeCandidate } from "./check.mjs";

export async function checkStaged(root = process.cwd()) {
  const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });

  const entries = new Map();

  for (const record of git(["ls-files", "--stage", "-z"]).split("\0").filter(Boolean)) {
    const [header, file] = record.split(/\t(.+)/s);

    const [mode, hash, stage] = header.split(" ");

    if (stage !== "0") {
      throw new Error("Resolve index conflicts before committing.");
    }

    entries.set(file, { mode, hash });
  }

  const readStaged = (file) => {
    if (!safeCandidate(file)) {
      throw new Error("Refusing an unsafe staged path before content access.");
    }

    const entry = entries.get(file);

    if (!entry || !["100644", "100755"].includes(entry.mode)) {
      throw new Error(`Required regular staged file unavailable: ${file}`);
    }

    return git(["cat-file", "blob", entry.hash]);
  };

  const names = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"])
    .split("\0")
    .filter((file) => file && safeCandidate(file));

  if (!names.length) {
    console.log(
      "Staged formatting: no supported safe changed files; full verify remains required.",
    );

    return 0;
  }

  const config = JSON.parse(readStaged(".prettierrc.json"));

  const baseline = JSON.parse(readStaged("scripts/engineering/baseline.json"));

  const findings = [];

  for (const file of names) {
    const content = readStaged(file);

    if (!(await prettier.check(content, { ...config, filepath: file }))) {
      findings.push({
        rule: "STD-004",
        file,
        sha256: createHash("sha256").update(content).digest("hex"),
      });
    }
  }

  console.log(
    `Checked ${names.length} safe changed index blobs; unstaged contents were not inspected.`,
  );

  return printResult(
    compareBaseline(
      findings,
      baseline.format.filter((entry) => names.includes(entry.file)),
    ),
    findings.length,
    "Staged formatting",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = await checkStaged();
  } catch (error) {
    console.error(`Staged formatting BLOCKED: ${error.message}`);
    process.exitCode = 1;
  }
}
