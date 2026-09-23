import "server-only";

import type { PrismaClient, WorkflowInstance } from "@/generated/prisma/client";
import {
  WorkflowInstanceStoreError,
  type WorkflowInstanceStore,
} from "./types";
import type { CreateWorkflowInstanceInput, SaveWorkflowInstanceInput } from "./types";

export class WorkflowInstanceRepository implements WorkflowInstanceStore {
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
      return await this.database.$transaction(async (transaction) => {
        const update = await transaction.workflowInstance.updateMany({
          where: { id: input.id, status: "active" },
          data: {
            status: input.status,
            state: input.state,
            completedAt: input.completedAt,
          },
        });

        if (update.count === 0) {
          const existing = await transaction.workflowInstance.findUnique({
            where: { id: input.id },
            select: { status: true },
          });

          if (!existing) {
            throw new WorkflowInstanceStoreError(
              "not_found",
              "The workflow instance was not found.",
            );
          }

          throw new WorkflowInstanceStoreError(
            "terminal",
            "The workflow instance is already terminal.",
          );
        }

        const record = await transaction.workflowInstance.findUnique({ where: { id: input.id } });

        if (!record) {
          throw new WorkflowInstanceStoreError(
            "not_found",
            "The workflow instance was not found after persistence.",
          );
        }

        return record;
      });
    } catch (error) {
      throw normalizePersistenceError(error);
    }
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

  return new WorkflowInstanceStoreError(
    "unavailable",
    "Workflow persistence is unavailable.",
    { cause: error },
  );
}
