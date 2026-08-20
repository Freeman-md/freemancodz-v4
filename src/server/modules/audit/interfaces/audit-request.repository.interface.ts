import type { AuditRequest } from "@/generated/prisma/client";
import type { SubmitAuditRequestInput } from "./audit.service.interface";

export interface IAuditRequestRepository {
  createOrFind(input: SubmitAuditRequestInput): Promise<AuditRequest>;
  list(): Promise<AuditRequest[]>;
}
