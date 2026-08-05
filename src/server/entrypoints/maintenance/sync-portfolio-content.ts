import { portfolioContentScopes, type PortfolioContentScope } from "../../../../content/portfolio";
import { portfolioContentService } from "@/server/composition-root";
import { requireProductionConfirmation } from "./require-production-confirmation";
import { validatePortfolioContentScopes } from "@/server/modules/portfolio/schemas/portfolio-content.schema";

const isProductionRun = process.argv.includes("--production");
const requestedScopes = process.argv.slice(2).filter((argument) => argument !== "--production");

function selectScopes(): PortfolioContentScope[] {
  if (requestedScopes.length === 0) return portfolioContentScopes;
  const unknown = requestedScopes.filter((scope) => !portfolioContentScopes.includes(scope as PortfolioContentScope));
  if (unknown.length > 0) throw new Error(`Unknown content scope: ${unknown.join(", ")}. Allowed scopes: ${portfolioContentScopes.join(", ")}.`);
  return requestedScopes as PortfolioContentScope[];
}

async function main() {
  const scopes = selectScopes();
  validatePortfolioContentScopes(scopes);
  if (isProductionRun) {
    console.log(`Production portfolio content sync for: ${scopes.join(", ")}`);
    requireProductionConfirmation();
  }
  const { prisma } = await import("@/server/infrastructure/database/prisma");
  try {
    const result = await portfolioContentService.sync(scopes);
    console.log(`Synced ${result.scopes.join(", ")}: inserted ${result.inserted}, updated ${result.updated}, unchanged ${result.unchanged}.`);
  } finally { await prisma.$disconnect(); }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
