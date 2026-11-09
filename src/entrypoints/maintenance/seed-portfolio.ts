import { readFile } from "node:fs/promises";
import {
  loadPortfolioTarget,
  PortfolioTargetError,
} from "@/infrastructure/config/portfolio-database";
import { createPortfolioSeedSession } from "@/modules/composition";
import { PortfolioSeedError } from "@/modules/portfolio/seed.error";

async function run(args: string[]) {
  if (
    new Set(args).size !== args.length ||
    args.some((arg) => arg !== "--production" && arg !== "--apply")
  ) {
    throw new PortfolioSeedError("Use only --production and --apply.");
  }

  const target = await loadPortfolioTarget(
    args.includes("--production") ? "production" : "development",
  );

  const apply = args.includes("--apply");

  const inputs = {
    profile: "profile",
    projects: "projects",
    caseStudies: "project-case-studies",
    experience: "experience",
    services: "services",
  };

  const entries = await Promise.all(
    Object.entries(inputs).map(async ([key, file]) => {
      try {
        const input: unknown = JSON.parse(await readFile(`prisma/seed-data/${file}.json`, "utf8"));

        return [key, input];
      } catch {
        throw new PortfolioSeedError(`Could not read valid JSON from ${file}.json.`);
      }
    }),
  );

  const session = createPortfolioSeedSession(target.connection);

  try {
    console.info(`Portfolio seed target: ${target.label} (${apply ? "apply" : "preview"})`);
    const changes = await session.service.run(Object.fromEntries(entries), apply);

    for (const { record, key, change } of changes) {
      console.info(`${change} ${record} ${key}`);
    }

    const totals = { insert: 0, update: 0, skip: 0 };

    for (const { change } of changes) {
      totals[change] += 1;
    }

    console.info(`Inserts: ${totals.insert}; updates: ${totals.update}; skips: ${totals.skip}.`);
  } finally {
    await session.disconnect();
  }
}

run(process.argv.slice(2)).catch((error: unknown) => {
  console.error(
    error instanceof PortfolioTargetError || error instanceof PortfolioSeedError
      ? error.message
      : "The portfolio seed failed. Check database access, migrations and concurrent writes.",
  );
  process.exitCode = 1;
});
