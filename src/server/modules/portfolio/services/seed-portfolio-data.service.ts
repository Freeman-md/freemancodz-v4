import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type { PortfolioSeedData } from "../../../../../prisma/seed-data/portfolio-seed";
import type { PortfolioSeedResult } from "../models/portfolio-seed.model";
import { replacePortfolioSeedData } from "../repositories/portfolio-seed.repository";

export async function seedPortfolioData(client: PrismaClient, data: PortfolioSeedData): Promise<PortfolioSeedResult> {
  try {
    await replacePortfolioSeedData(client, data);
    return { contentBlocks: data.contentBlocks.length, principles: data.principles.length, services: data.services.length, experiences: data.experiences.length, projects: data.projects.length };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Portfolio seed failed: ${detail}`, { cause: error });
  } finally {
    await client.$disconnect();
  }
}
