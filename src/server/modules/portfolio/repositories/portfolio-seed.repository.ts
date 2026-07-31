import "server-only";

import type { PortfolioSeedData } from "../../../../../prisma/seed-data/portfolio-seed";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IPortfolioSeedRepository } from "../interfaces/portfolio-seed.repository.interface";

export class PortfolioSeedRepository implements IPortfolioSeedRepository {
  constructor(private readonly database: PrismaClient) {}
  async replace(data: PortfolioSeedData) {
  await this.database.$transaction(async (transaction) => {
    await transaction.contentBlock.deleteMany();
    await transaction.principle.deleteMany();
    await transaction.service.deleteMany();
    await transaction.experience.deleteMany();
    await transaction.project.deleteMany();
    await transaction.contentBlock.createMany({ data: data.contentBlocks });
    await transaction.principle.createMany({ data: data.principles });
    await transaction.service.createMany({ data: data.services });
    await transaction.experience.createMany({ data: data.experiences });
    await transaction.project.createMany({ data: data.projects });
  });
  }
}
