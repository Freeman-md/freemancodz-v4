import type { AboutPageData } from "../models/page-data";
export interface IAboutService {
  getPageData(): Promise<AboutPageData>;
}
