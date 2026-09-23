import type { HomePageData } from "../models/page-data";
export interface IHomeService {
  getPageData(): Promise<HomePageData>;
}
