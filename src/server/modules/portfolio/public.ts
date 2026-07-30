import "server-only";

export { getAboutPageData } from "./services/get-about-page-data.service";
export { getHomePageData } from "./services/get-home-page-data.service";
export { getWorkPageData } from "./services/get-work-page-data.service";
export type { AboutPageData, HomePageData, WorkPageData } from "./models/portfolio-view.model";
