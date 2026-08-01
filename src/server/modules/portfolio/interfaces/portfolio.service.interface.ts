import type { PortfolioAsset } from "../models/portfolio-asset";
import type { AboutPageData, HomePageData, WorkPageData } from "../models/portfolio-view";
export interface IPortfolioService {
  getHomePageData(): Promise<HomePageData>;
  getWorkPageData(): Promise<WorkPageData>;
  getAboutPageData(): Promise<AboutPageData>;
  getAsset(pathname: string): Promise<PortfolioAsset>;
}
