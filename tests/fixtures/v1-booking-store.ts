import type { PrismaClient, WorkflowInstance } from "@/generated/prisma/client";
import { WorkflowInstanceRepository } from "@/modules/workflow/repository";
import { meetingBookingStateSchema } from "@/modules/workflow/definitions/meeting-booking/meeting-booking.schema";
import { WorkflowInstanceStoreError } from "@/modules/workflow/errors";
import type { SaveWorkflowInstanceInput } from "@/modules/workflow/types";

export class V1BookingRepository extends WorkflowInstanceRepository {
  constructor(private readonly v1Db: PrismaClient) {
    super(v1Db);
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
      return await this.v1Db.$transaction(
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
