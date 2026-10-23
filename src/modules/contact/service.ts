import "server-only";

import type { ContactRequest } from "@/generated/prisma/client";
import type { NotificationService } from "@/modules/notification/service";
import type { ContactRequestStore, SubmitContactRequestInput } from "./types";

export class ContactService {
  constructor(
    private readonly repository: ContactRequestStore,
    private readonly notifications: Pick<NotificationService, "notifyContactSubmitted">,
  ) {}

  async submit(input: SubmitContactRequestInput): Promise<ContactRequest> {
    const request = await this.repository.createOrFind(input);

    // A recovered row must describe the accepted request, not an older summary.
    if (
      Object.entries(input).some(([key, value]) => request[key as keyof typeof input] !== value)
    ) {
      throw new Error(
        "The saved submission does not match the accepted details. Reconciliation is required.",
      );
    }

    await this.notifications.notifyContactSubmitted(request);

    return request;
  }

  listRequests(): Promise<ContactRequest[]> {
    return this.repository.list();
  }
}
