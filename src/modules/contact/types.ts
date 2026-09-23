import type { ContactRequest } from "@/generated/prisma/client";

export type SubmitContactRequestInput = Omit<ContactRequest, "id" | "createdAt">;

export type ContactRequestStore = {
  createOrFind(input: SubmitContactRequestInput): Promise<ContactRequest>;
  list(): Promise<ContactRequest[]>;
};
