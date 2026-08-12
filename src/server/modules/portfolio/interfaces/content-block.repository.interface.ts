import type { ContentBlockNode } from "../models/portfolio-records";
export type PortfolioPagePath = "/" | "/work" | "/about" | "/audit";
export interface IContentBlockRepository {
  findPageTree(page: PortfolioPagePath): Promise<ContentBlockNode[]>;
}
