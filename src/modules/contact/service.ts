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

    await this.notifications.notifyContactSubmitted(request);

    return request;
  }

  listRequests(): Promise<ContactRequest[]> {
    return this.repository.list();
  }
}
