import "server-only";

export type { IPortfolioService } from "./interfaces/portfolio.service.interface";
export type { IPortfolioSeedService } from "./interfaces/portfolio-seed.service.interface";
export type { AboutPageData, HomePageData, WorkPageData } from "./models/portfolio-view";
export { aboutHeaderContentSchema, currentDirectionContentSchema, educationContentSchema, heroContentSchema, outsideEngineeringContentSchema, philosophyContentSchema, textBlockContentSchema } from "./schemas/content-block.schema";
