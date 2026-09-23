import "server-only";

import type { AuditRequest } from "@/generated/prisma/client";
import type { AuditRequestStore, SubmitAuditRequestInput } from "./types";

export class AuditService {
  constructor(private readonly repository: AuditRequestStore) {}

  submit(input: SubmitAuditRequestInput): Promise<AuditRequest> {
    return this.repository.createOrFind(input);
  }

  listRequests(): Promise<AuditRequest[]> {
    return this.repository.list();
  }
}
