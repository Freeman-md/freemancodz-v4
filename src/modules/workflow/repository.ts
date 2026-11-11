import "server-only";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";

export class WorkflowRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: {
    workflowId: string;
    workflowVersion: number;
    state: Prisma.InputJsonObject;
    originChannel: string;
  }) {
    return this.prisma.workflowInstance.create({
      data: input,
      select: { id: true, workflowId: true, workflowVersion: true },
    });
  }
}
