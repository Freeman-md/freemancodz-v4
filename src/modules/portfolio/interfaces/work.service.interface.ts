import type { WorkPageData } from "../models/page-data";
export interface IWorkService {
  getPageData(): Promise<WorkPageData>;
}
