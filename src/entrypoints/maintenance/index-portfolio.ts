import { config } from "dotenv";
import {
  loadPortfolioTarget,
  PortfolioTargetError,
} from "@/infrastructure/config/portfolio-database";
import { createPortfolioIndexSession } from "@/modules/composition";

async function run(args: string[]) {
  if (
    new Set(args).size !== args.length ||
    args.some((arg) => arg !== "--production" && arg !== "--apply")
  ) {
    throw new PortfolioTargetError("Use only --production and --apply.");
  }

  const environment = args.includes("--production") ? "production" : "development";

  const apply = environment === "development" || args.includes("--apply");

  const target = await loadPortfolioTarget(environment);

  if (apply) {
    // Read the embedding provider's config only after verifying the database target.
    config({ path: environment === "production" ? ".env.production.local" : ".env", quiet: true });
  }

  const session = createPortfolioIndexSession(target.connection);

  try {
    console.info(`Portfolio index target: ${target.label} (${apply ? "apply" : "preview"})`);
    const keys = await session.service.refresh(apply);

    for (const key of keys) {
      console.info(key);
    }

    console.info(`${apply ? "Indexed" : "Would index"} ${keys.length} portfolio documents.`);
  } finally {
    await session.disconnect();
  }
}

run(process.argv.slice(2)).catch((error: unknown) => {
  console.error(
    error instanceof PortfolioTargetError
      ? error.message
      : "Portfolio indexing failed. Check the seeded portfolio, migrations and embedding access.",
  );
  process.exitCode = 1;
});
