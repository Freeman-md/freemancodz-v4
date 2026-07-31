import "server-only";
import type { PortfolioSeedData } from "../../../../../prisma/seed-data/portfolio-seed";
import type { IPortfolioSeedRepository } from "../interfaces/portfolio-seed.repository.interface";
import type { IPortfolioSeedService } from "../interfaces/portfolio-seed.service.interface";
import type { PortfolioSeedResult } from "../models/portfolio-seed";
export class PortfolioSeedService implements IPortfolioSeedService { constructor(private readonly repository: IPortfolioSeedRepository) {} async seed(data: PortfolioSeedData): Promise<PortfolioSeedResult> { try { await this.repository.replace(data); return { contentBlocks: data.contentBlocks.length, principles: data.principles.length, services: data.services.length, experiences: data.experiences.length, projects: data.projects.length }; } catch (error) { throw new Error(`Portfolio seed failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error }); } } }
