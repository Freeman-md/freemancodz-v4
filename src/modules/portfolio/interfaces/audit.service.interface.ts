import type { AuditPageData } from "../models/page-data";
export interface IAuditService {
  getPageData(): Promise<AuditPageData>;
}
