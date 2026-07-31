import type { PortfolioSeedData } from "../../../../../prisma/seed-data/portfolio-seed";
import type { PortfolioSeedResult } from "../models/portfolio-seed";
export interface IPortfolioSeedService { seed(data: PortfolioSeedData): Promise<PortfolioSeedResult>; }
