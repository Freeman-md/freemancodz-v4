import type { PortfolioContentScope } from "../../../../../content/portfolio";
import type { PortfolioContentSyncCounts } from "./portfolio-content.repository.interface";

export type PortfolioContentSyncResult = PortfolioContentSyncCounts & {
  scopes: PortfolioContentScope[];
};

export interface IPortfolioContentService {
  sync(scopes: PortfolioContentScope[]): Promise<PortfolioContentSyncResult>;
}
