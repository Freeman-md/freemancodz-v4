import "server-only";

import type { AuditRequest } from "@/generated/prisma/client";
import type {
  IAuditRequestRepository,
} from "../interfaces/audit-request.repository.interface";
import type {
  IAuditService,
  SubmitAuditRequestInput,
} from "../interfaces/audit.service.interface";

export class AuditService implements IAuditService {
  constructor(private readonly repository: IAuditRequestRepository) {}

  submit(input: SubmitAuditRequestInput): Promise<AuditRequest> {
    return this.repository.createOrFind(input);
  }

  listRequests(): Promise<AuditRequest[]> {
    return this.repository.list();
  }
}
