import { readFile } from "node:fs/promises";
import type { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPortfolioSeedRepository } from "@/modules/portfolio/repositories/portfolio-seed.repository";
import { PortfolioSeedService } from "@/modules/portfolio/seed.service";
import profile from "../../prisma/seed-data/profile.json";
import projects from "../../prisma/seed-data/projects.json";
import caseStudies from "../../prisma/seed-data/project-case-studies.json";
import experience from "../../prisma/seed-data/experience.json";
import services from "../../prisma/seed-data/services.json";

export const portfolioSeedFixture = { profile, projects, caseStudies, experience, services };

export async function applyPrismaMigration(
  database: Client,
  directory: string,
  seedBeforeCleanup?: string,
) {
  if (directory === "20260901090000_simplify_audit_presentation") {
    // The historical data migration ran against an initialized audit page.
    await database.query(`
      INSERT INTO public.content_blocks (title, url, "order") VALUES
        ('Before and after', '/audit#audit-before-after', 2),
        ('Symptoms', '/audit#audit-why', 3),
        ('Proof', '/audit#audit-proof', 4),
        ('Request', '/audit#audit-cta', 5);
    `);
  }

  if (seedBeforeCleanup && directory === "20261109131000_remove_legacy_portfolio") {
    const prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: seedBeforeCleanup }),
    });

    try {
      const seed = new PortfolioSeedService(new PrismaPortfolioSeedRepository(prisma));

      await seed.run(portfolioSeedFixture, true);
    } finally {
      await prisma.$disconnect();
    }
  }

  const sql = await readFile(`prisma/migrations/${directory}/migration.sql`, "utf8");

  await database.query(sql);
}
