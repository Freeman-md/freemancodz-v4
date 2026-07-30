import "server-only";

import type { PortfolioSeedData } from "../../../../../prisma/seed-data/portfolio-seed";
import type { PortfolioSeedResult } from "../models/portfolio-seed";
import { replacePortfolioSeedData } from "../repositories/portfolio-seed.repository";

export type SeedPortfolioDataDependencies = {
  replacePortfolioSeedData: (data: PortfolioSeedData) => Promise<void>;
};

export function createSeedPortfolioData({ replacePortfolioSeedData: replace }: SeedPortfolioDataDependencies) {
  return async function seedPortfolioData(data: PortfolioSeedData): Promise<PortfolioSeedResult> {
    try {
      await replace(data);
      return { contentBlocks: data.contentBlocks.length, principles: data.principles.length, services: data.services.length, experiences: data.experiences.length, projects: data.projects.length };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Portfolio seed failed: ${detail}`, { cause: error });
    }
  }
}

export const seedPortfolioData = createSeedPortfolioData({ replacePortfolioSeedData });
