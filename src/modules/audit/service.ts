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

    // A recovered row must describe the accepted request, not an older summary.
    if (
      Object.entries(input).some(([key, value]) => request[key as keyof typeof input] !== value)
    ) {
      throw new Error(
        "The saved submission does not match the accepted details. Reconciliation is required.",
      );
    }

    await this.notifications.notifyAuditSubmitted(request);

    return request;
  }

  listRequests(): Promise<AuditRequest[]> {
    return this.repository.list();
  }
}
