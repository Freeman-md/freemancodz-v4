import { getPortfolioSeedData } from "../../../../prisma/seed-data/portfolio-seed";
import { portfolioSeedService } from "@/server/composition-root";
import { requireProductionConfirmation } from "./require-production-confirmation";

const isProductionRun = process.argv.includes("--production");

async function main() {
  if (isProductionRun) {
    requireProductionConfirmation();
  }

  const { prisma } = await import("@/server/infrastructure/database/prisma");

  try {
    const data = await portfolioSeedService.seed(getPortfolioSeedData());

    console.log(
      `Seeded portfolio data: ${data.contentBlocks} content blocks, ${data.principles} principles, ${data.services} services, ${data.experiences} experiences, and ${data.projects} projects.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
