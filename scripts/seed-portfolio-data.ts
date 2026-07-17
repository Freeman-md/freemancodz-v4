import { config as loadEnv } from "dotenv";

import { seedPortfolioData } from "./lib/portfolio-seed";

loadEnv({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const data = await seedPortfolioData(prisma);

  console.log(
    `Seeded portfolio data: ${data.contentBlocks.length} content blocks, ${data.principles.length} principles, ${data.services.length} services, ${data.experiences.length} experiences, and ${data.projects.length} projects.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
