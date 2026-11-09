import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import {
  loadPortfolioTarget,
  PortfolioTargetError,
} from "@/infrastructure/config/portfolio-database";

async function run() {
  if (process.argv.length !== 2) {
    throw new PortfolioTargetError("The production migration command takes no arguments.");
  }

  const { connection, label } = await loadPortfolioTarget("production");

  const requireFromProject = createRequire(resolve("package.json"));

  const prismaRoot = dirname(requireFromProject.resolve("prisma/package.json"));

  console.info(`Portfolio migration target: ${label}`);
  const result = spawnSync(
    process.execPath,
    [resolve(prismaRoot, "build/index.js"), "migrate", "deploy"],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, DATABASE_URL: connection },
    },
  );

  if (result.status !== 0) {
    const code = result.stderr?.match(/\bP\d{4}\b/)?.[0];

    throw new PortfolioTargetError(
      `Prisma migrate deploy failed${code ? ` (${code})` : ""}. Check the target database and migration history.`,
    );
  }

  const applied = Array.from(
    result.stdout.matchAll(/Applying migration `(\d{14}_[a-z0-9_]+)`/g),
    ([, name]) => name,
  );

  for (const migration of applied) {
    console.info(`Applied migration: ${migration}`);
  }

  console.info(
    applied.length ? `Migrations applied: ${applied.length}.` : "No pending migrations.",
  );
}

run().catch((error: unknown) => {
  console.error(
    error instanceof PortfolioTargetError
      ? error.message
      : "The production migration command could not run.",
  );
  process.exitCode = 1;
});
