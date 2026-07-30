import { config as loadEnv } from "dotenv";

import { getPortfolioSeedData } from "./seed-data/portfolio-seed";
import { seedPortfolioData } from "../src/server/modules/portfolio/public";

loadEnv({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/server/infrastructure/database/prisma");
  const data = await seedPortfolioData(prisma, getPortfolioSeedData());

  console.log(
      `Seeded portfolio data: ${data.contentBlocks} content blocks, ` +
      `${data.principles} principles, ` +
      `${data.services} services, ` +
      `${data.experiences} experiences, and ` +
      `${data.projects} projects.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../src/server/infrastructure/database/prisma");
    await prisma.$disconnect();
  });
