import type { AuditRequest } from "@/generated/prisma/client";

export type SubmitAuditRequestInput = Omit<AuditRequest, "id" | "createdAt">;

export type AuditRequestStore = {
  createOrFind(input: SubmitAuditRequestInput): Promise<AuditRequest>;
  list(): Promise<AuditRequest[]>;
};
