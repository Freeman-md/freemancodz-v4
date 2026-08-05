import type { PortfolioAsset } from "../models/portfolio-asset";
import type { AboutPageData, AuditPageData, HomePageData, WorkPageData } from "../models/portfolio-view";
export interface IPortfolioService {
  getHomePageData(): Promise<HomePageData>;
  getWorkPageData(): Promise<WorkPageData>;
  getAboutPageData(): Promise<AboutPageData>;
  getAuditPageData(): Promise<AuditPageData>;
  getAsset(pathname: string): Promise<PortfolioAsset>;
}
