import "server-only";

import { prisma } from "../infrastructure/database/prisma";
import type { IAuditService } from "../modules/audit/public";
import { AuditRequestRepository } from "../modules/audit/repositories/audit-request.repository";
import { AuditService } from "../modules/audit/services/audit.service";

export const auditRequestService: IAuditService = new AuditService(
  new AuditRequestRepository(prisma),
);
