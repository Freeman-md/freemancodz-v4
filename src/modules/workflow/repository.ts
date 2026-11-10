import "server-only";

import type { Prisma, PrismaClient, WorkflowInstance } from "@/generated/prisma/client";
import { WorkflowInstanceStoreError } from "./errors";
import type { IWorkflowInstanceRepository } from "./interfaces";
import type { CreateWorkflowInstanceInput, SaveWorkflowInstanceInput } from "./types";

export class WorkflowInstanceRepository implements IWorkflowInstanceRepository {
  constructor(private readonly database: PrismaClient) {}

  async create(input: CreateWorkflowInstanceInput): Promise<WorkflowInstance> {
    try {
      const record = await this.database.workflowInstance.create({
        data: {
          workflowId: input.workflowId,
          workflowVersion: input.workflowVersion,
          status: "active",
          state: input.state,
          originChannel: input.originChannel,
          originPage: input.originPage,
          originEntry: input.originEntry,
        },
      });

      return record;
    } catch (error) {
      throw normalizePersistenceError(error);
    }
  }

  async findById(id: string): Promise<WorkflowInstance | null> {
    try {
      const record = await this.database.workflowInstance.findUnique({ where: { id } });

      return record;
    } catch (error) {
      throw normalizePersistenceError(error);
    }
  }

  async save(input: SaveWorkflowInstanceInput): Promise<WorkflowInstance> {
    validateCompletedAt(input);
    try {
      return await this.database.$transaction((transaction) =>
        this.saveInTransaction(transaction, input),
      );
    } catch (error) {
      throw normalizePersistenceError(error);
    }
  }

  protected async saveInTransaction(
    transaction: Prisma.TransactionClient,
    input: SaveWorkflowInstanceInput,
  ): Promise<WorkflowInstance> {
    const update = await transaction.workflowInstance.updateMany({
      where: { id: input.id, status: "active", revision: input.expectedRevision },
      data: {
        status: input.status,
        state: input.state,
        completedAt: input.completedAt,
        revision: { increment: 1 },
      },
    });

    if (update.count === 0) {
      const existing = await transaction.workflowInstance.findUnique({
        where: { id: input.id },
        select: { status: true },
      });

      if (!existing) {
        throw new WorkflowInstanceStoreError("not_found", "The workflow instance was not found.");
      }

      throw new WorkflowInstanceStoreError(
        existing.status === "active" ? "stale" : "terminal",
        "The workflow has changed.",
      );
    }

    const record = await transaction.workflowInstance.findUnique({ where: { id: input.id } });

    if (!record) {
      throw new WorkflowInstanceStoreError(
        "not_found",
        "The workflow instance was not found after persistence.",
      );
    }

    if (input.replacement) {
      if (input.status !== "cancelled") {
        throw new WorkflowInstanceStoreError("unavailable", "Invalid replacement.");
      }

      return transaction.workflowInstance.create({
        data: { ...input.replacement, status: "active" },
      });
    }

    return record;
  }
}

function validateCompletedAt(input: SaveWorkflowInstanceInput): void {
  const completionTimestampIsValid =
    (input.status === "completed" && input.completedAt !== null) ||
    (input.status !== "completed" && input.completedAt === null);

  if (!completionTimestampIsValid) {
    throw new WorkflowInstanceStoreError(
      "unavailable",
      "The workflow lifecycle update is invalid.",
    );
  }
}

function normalizePersistenceError(error: unknown): WorkflowInstanceStoreError {
  if (error instanceof WorkflowInstanceStoreError) {
    return error;
  }

  return new WorkflowInstanceStoreError("unavailable", "Workflow persistence is unavailable.", {
    cause: error,
  });
}
