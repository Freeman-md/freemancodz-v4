import "server-only";

import type { AuditRequest, PrismaClient } from "@/generated/prisma/client";
import type { AuditRequestStore, SubmitAuditRequestInput } from "./types";

export class AuditRequestRepository implements AuditRequestStore {
  constructor(private readonly database: PrismaClient) {}

  createOrFind(input: SubmitAuditRequestInput): Promise<AuditRequest> {
    return this.database.auditRequest.upsert({
      where: { workflowInstanceId: input.workflowInstanceId },
      create: input,
      update: {},
    });
  }

  list(): Promise<AuditRequest[]> {
    return this.database.auditRequest.findMany({ orderBy: { createdAt: "desc" } });
  }
}
