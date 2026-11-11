import "server-only";

import type { Prisma, PrismaClient, WorkflowInstance } from "@/generated/prisma/client";

export type StoredWorkflow = Pick<
  WorkflowInstance,
  "id" | "workflowId" | "workflowVersion" | "state" | "revision"
>;

export class WorkflowRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async startOrResume(input: {
    visitorKey: string;
    workflowId: string;
    workflowVersion: number;
    state: Prisma.InputJsonObject;
    originChannel: string;
  }) {
    // Assigning the same workflow ID lets PostgreSQL return the existing row in the
    // same statement while preserving its state and version.
    const [instance] = await this.prisma.$queryRaw<StoredWorkflow[]>`
      INSERT INTO "workflow_instances" (
        "visitor_key", "workflow_id", "workflow_version", "state", "origin_channel"
      )
      VALUES (
        ${input.visitorKey}, ${input.workflowId}, ${input.workflowVersion},
        ${JSON.stringify(input.state)}::jsonb, ${input.originChannel}
      )
      ON CONFLICT ("visitor_key", "workflow_id")
        WHERE "status" = 'active' AND "visitor_key" IS NOT NULL
      DO UPDATE SET "workflow_id" = EXCLUDED."workflow_id"
      RETURNING "id", "workflow_id" AS "workflowId", "workflow_version" AS "workflowVersion", "state", "revision"
    `;

    if (!instance) {
      throw new Error("The workflow instance could not be saved.");
    }

    return instance;
  }

  async saveState(input: {
    id: string;
    visitorKey: string;
    revision: number;
    state: Prisma.InputJsonObject;
  }): Promise<StoredWorkflow | null> {
    const [updated] = await this.prisma.workflowInstance.updateManyAndReturn({
      where: {
        id: input.id,
        visitorKey: input.visitorKey,
        status: "active",
        revision: input.revision,
      },
      data: {
        state: input.state,
        revision: { increment: 1 },
      },
      select: {
        id: true,
        workflowId: true,
        workflowVersion: true,
        state: true,
        revision: true,
      },
    });

    return updated ?? null;
  }

  findActive(visitorKey: string): Promise<StoredWorkflow | null> {
    return this.prisma.workflowInstance.findFirst({
      where: { visitorKey, status: "active" },
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      select: { id: true, workflowId: true, workflowVersion: true, state: true, revision: true },
    });
  }
}
