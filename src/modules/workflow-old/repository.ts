import "server-only";

import type { Prisma, PrismaClient, WorkflowInstance } from "@/generated/prisma/client";
import { meetingBookingStateSchema } from "./definitions/meeting-booking/meeting-booking.schema";
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

  async claimMeetingBooking(input: SaveWorkflowInstanceInput): Promise<WorkflowInstance> {
    validateCompletedAt(input);
    const parsed = meetingBookingStateSchema.safeParse(input.state);

    if (
      !parsed.success ||
      parsed.data.step !== "confirmed" ||
      !parsed.data.bookingOperation ||
      !parsed.data.selectedSlot ||
      input.status !== "active" ||
      input.replacement
    ) {
      throw new WorkflowInstanceStoreError("unavailable", "The booking claim is invalid.");
    }

    const slot = parsed.data.selectedSlot;

    const start = Date.parse(slot.start);

    const end = Date.parse(slot.end);

    if (!(start < end)) {
      throw new WorkflowInstanceStoreError("unavailable", "The booking interval is invalid.");
    }

    try {
      return await this.database.$transaction(
        async (transaction) => {
          await transaction.$executeRaw`SET LOCAL lock_timeout = '2s'`;
          // One calendar: serialize acceptance, not the slower Calendar request.
          await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('freemancodz:meeting-booking'))`;

          const current = await transaction.workflowInstance.findUnique({
            where: { id: input.id },
            select: { workflowId: true },
          });

          if (!current || current.workflowId !== "meeting-booking") {
            throw new WorkflowInstanceStoreError("unavailable", "The booking workflow is invalid.");
          }

          // This separate READ COMMITTED query sees the preceding lock holder's committed claim.
          const claims = await transaction.workflowInstance.findMany({
            where: {
              id: { not: input.id },
              workflowId: "meeting-booking",
              status: { in: ["active", "completed"] },
              state: { path: ["step"], equals: "confirmed" },
            },
            select: { state: true },
          });

          for (const claim of claims) {
            const saved = meetingBookingStateSchema.safeParse(claim.state);

            if (
              !saved.success ||
              !saved.data.selectedSlot ||
              !(Date.parse(saved.data.selectedSlot.start) < Date.parse(saved.data.selectedSlot.end))
            ) {
              throw new WorkflowInstanceStoreError(
                "unavailable",
                "A saved booking needs reconciliation.",
              );
            }

            if (
              start < Date.parse(saved.data.selectedSlot.end) &&
              end > Date.parse(saved.data.selectedSlot.start)
            ) {
              throw new WorkflowInstanceStoreError(
                "slot_unavailable",
                "Another booking owns this interval.",
              );
            }
          }

          return this.saveInTransaction(transaction, input);
        },
        { isolationLevel: "ReadCommitted" },
      );
    } catch (error) {
      throw normalizePersistenceError(error);
    }
  }

  private async saveInTransaction(
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
