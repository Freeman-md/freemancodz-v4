import { portfolioContentScopes } from "../../../../content/portfolio";
import { portfolioContentService } from "@/server/composition-root";
import { requireProductionConfirmation } from "../helpers/require-production-confirmation";
import {
  executePortfolioContentSync,
  parsePortfolioContentSyncArguments,
} from "./portfolio-content-sync.arguments";

async function main() {
  const argumentsResult = parsePortfolioContentSyncArguments(
    process.argv.slice(2),
    portfolioContentScopes,
  );

  if (argumentsResult.isProduction) {
    console.log(`Production portfolio content sync for: ${argumentsResult.scopes.join(", ")}`);
  }

  const { prisma } = await import("@/server/infrastructure/database/prisma");

  try {
    const result = await executePortfolioContentSync(argumentsResult, {
      confirmProduction: requireProductionConfirmation,
      sync: (scopes) => portfolioContentService.sync(scopes),
    });

    console.log(
      `Synced ${result.scopes.join(", ")}: inserted ${result.inserted}, updated ${result.updated}, unchanged ${result.unchanged}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
