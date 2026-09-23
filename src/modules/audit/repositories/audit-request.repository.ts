import "server-only";

import type { AuditRequest, PrismaClient } from "@/generated/prisma/client";
import type {
  IAuditRequestRepository,
} from "../interfaces/audit-request.repository.interface";
import type { SubmitAuditRequestInput } from "../interfaces/audit.service.interface";

export class AuditRequestRepository implements IAuditRequestRepository {
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
