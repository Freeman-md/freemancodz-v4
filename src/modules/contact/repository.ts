import "server-only";

import type { ContactRequest, PrismaClient } from "@/generated/prisma/client";
import type { ContactRequestStore, SubmitContactRequestInput } from "./types";

export class ContactRequestRepository implements ContactRequestStore {
  constructor(private readonly database: PrismaClient) {}

  createOrFind(input: SubmitContactRequestInput): Promise<ContactRequest> {
    return this.database.contactRequest.upsert({
      where: { workflowInstanceId: input.workflowInstanceId },
      create: input,
      update: {},
    });
  }

  list(): Promise<ContactRequest[]> {
    return this.database.contactRequest.findMany({ orderBy: { createdAt: "desc" } });
  }
}
