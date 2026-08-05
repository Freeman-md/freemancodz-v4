import type { PortfolioContentScope } from "../../../../../content/portfolio";

export type PortfolioContentSyncCounts = { inserted: number; updated: number; unchanged: number };

export interface IPortfolioContentRepository {
  sync(scope: PortfolioContentScope): Promise<PortfolioContentSyncCounts>;
}
