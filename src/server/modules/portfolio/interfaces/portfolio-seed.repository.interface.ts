import type { PortfolioSeedData } from "../../../../../prisma/seed-data/portfolio-seed";
export interface IPortfolioSeedRepository { replace(data: PortfolioSeedData): Promise<void>; }
