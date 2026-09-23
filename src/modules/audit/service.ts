import "server-only";

import type { AuditRequest } from "@/generated/prisma/client";
import type { NotificationService } from "@/modules/notification/service";
import type { AuditRequestStore, SubmitAuditRequestInput } from "./types";

export class AuditService {
  constructor(
    private readonly repository: AuditRequestStore,
    private readonly notifications: Pick<NotificationService, "notifyAuditSubmitted">,
  ) {}

  async submit(input: SubmitAuditRequestInput): Promise<AuditRequest> {
    const request = await this.repository.createOrFind(input);

    await this.notifications.notifyAuditSubmitted(request);

    return request;
  }

  listRequests(): Promise<AuditRequest[]> {
    return this.repository.list();
  }
}
