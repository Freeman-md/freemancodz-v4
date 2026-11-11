import "server-only";

import type { Prisma, PrismaClient, WorkflowInstance } from "@/generated/prisma/client";

export type StoredWorkflow = Pick<
  WorkflowInstance,
  "id" | "workflowId" | "workflowVersion" | "state" | "revision"
>;

const workflowFields = {
  id: true,
  workflowId: true,
  workflowVersion: true,
  state: true,
  revision: true,
} as const;

export class WorkflowRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async startOrResume(input: {
    visitorKey: string;
    workflowId: string;
    workflowVersion: number;
    state: Prisma.InputJsonObject;
    originChannel: string;
  }) {
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
    return this.prisma.$transaction(async (tx) => {
      const [updated] = await tx.workflowInstance.updateManyAndReturn({
        where: {
          id: input.id,
          visitorKey: input.visitorKey,
          status: "active",
          revision: input.revision,
          reviews: { none: { status: "consumed" } },
        },
        data: { state: input.state, revision: { increment: 1 } },
        select: workflowFields,
      });

      if (!updated) {
        return null;
      }

      await tx.workflowReview.updateMany({
        where: { instanceId: input.id, status: "pending" },
        data: { status: "invalidated" },
      });

      return updated;
    });
  }

  findActive(visitorKey: string): Promise<StoredWorkflow | null> {
    return this.prisma.workflowInstance.findFirst({
      where: {
        visitorKey,
        OR: [{ status: "active" }, { reviews: { some: { status: "consumed" } } }],
      },
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      select: workflowFields,
    });
  }

  discardDraft(visitorKey: string, { id, revision }: { id: string; revision: number }) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.workflowInstance.updateMany({
        where: {
          id,
          visitorKey,
          revision,
          status: "active",
          reviews: { none: { status: "consumed" } },
        },
        data: { status: "cancelled", revision: { increment: 1 } },
      });

      if (count === 0) {
        return false;
      }

      await tx.workflowReview.updateMany({
        where: { instanceId: id, status: "pending" },
        data: { status: "invalidated" },
      });

      return true;
    });
  }

  async findRun(instanceId: string) {
    return this.prisma.workflowRun.findFirst({
      where: { review: { instanceId } },
      include: { review: { select: { actionKey: true } }, steps: { orderBy: { position: "asc" } } },
    });
  }

  ensureReview(input: {
    instance: StoredWorkflow;
    actionKey: string;
    display: Prisma.InputJsonObject;
    payload: Prisma.InputJsonObject;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const { id, revision, workflowVersion } = input.instance;

      const [current] = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM workflow_instances
        WHERE id = ${id}::uuid AND revision = ${revision} AND status = 'active'
        FOR UPDATE
      `;

      if (!current) {
        return null;
      }

      return tx.workflowReview.upsert({
        where: { instanceId_revision: { instanceId: id, revision } },
        update: {},
        create: {
          instanceId: id,
          revision,
          version: workflowVersion,
          actionKey: input.actionKey,
          display: input.display,
          payload: input.payload,
        },
      });
    });
  }

  async findOwnedReview(id: string, visitorKey: string) {
    return this.prisma.workflowReview.findFirst({
      where: { id, instance: { visitorKey } },
      include: { instance: { select: workflowFields } },
    });
  }

  approve(input: {
    id: string;
    instanceId: string;
    visitorKey: string;
    revision: number;
    version: number;
    steps: ReadonlyArray<{ key: string; label: string }>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const [instance] = await tx.$queryRaw<
        { revision: number; status: string; version: number }[]
      >`
        SELECT revision, status, workflow_version AS version
        FROM workflow_instances
        WHERE id = ${input.instanceId}::uuid AND visitor_key = ${input.visitorKey}
        FOR UPDATE
      `;

      if (!instance || instance.version !== input.version) {
        return false;
      }

      const review = await tx.workflowReview.findUnique({ where: { id: input.id } });

      if (
        !review ||
        review.instanceId !== input.instanceId ||
        review.revision !== input.revision ||
        review.version !== input.version
      ) {
        return false;
      }

      if (review.status === "consumed") {
        return true;
      }

      if (
        review.status !== "pending" ||
        instance.status !== "active" ||
        instance.revision !== input.revision
      ) {
        return false;
      }

      await tx.workflowReview.update({ where: { id: review.id }, data: { status: "consumed" } });
      await tx.workflowRun.create({
        data: {
          reviewId: review.id,
          steps: {
            create: input.steps.map(({ key, label }, position) => ({ key, label, position })),
          },
        },
      });
      await tx.workflowInstance.update({
        where: { id: input.instanceId },
        data: { revision: { increment: 1 } },
      });

      return true;
    });
  }
}
