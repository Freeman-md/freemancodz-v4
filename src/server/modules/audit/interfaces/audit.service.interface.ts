import type { AuditRequest } from "@/generated/prisma/client";

export type SubmitAuditRequestInput = Omit<AuditRequest, "id" | "createdAt">;

export interface IAuditService {
  submit(input: SubmitAuditRequestInput): Promise<AuditRequest>;
  listRequests(): Promise<AuditRequest[]>;
}
