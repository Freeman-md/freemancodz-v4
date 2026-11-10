import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient, type WorkflowExecution } from "@/generated/prisma/client";
import type { MeetingRecordInput } from "@/modules/meeting/types";
import { meetingBookingStateSchema } from "./definitions/meeting-booking/meeting-booking.schema";

export const MAX_EXECUTION_ATTEMPTS = 3;

const LEASE_MS = 45_000;

const bookingLock = async (tx: Prisma.TransactionClient) => {
  await tx.$executeRaw`SET LOCAL lock_timeout = '2s'`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('freemancodz:meeting-booking'))`;
};

export type ApprovedExecution = {
  id: string;
  instanceId: string;
  revision: number;
  actionKey: string;
  approvedInput: Prisma.InputJsonObject;
  acceptedState: Prisma.InputJsonObject;
  checkpoint: Prisma.InputJsonObject;
  reservation?: MeetingRecordInput;
  adopt?: boolean;
  needsReview?: boolean;
};

export class WorkflowExecutionRepository {
  constructor(private readonly db: PrismaClient) {}

  latest(instanceId: string) {
    return this.db.workflowExecution.findFirst({
      where: { workflowInstanceId: instanceId },
      orderBy: { reviewedRevision: "desc" },
    });
  }

  legacyCandidates() {
    return this.db.workflowInstance.findMany({
      where: {
        workflowId: "meeting-booking",
        workflowVersion: 1,
        status: "active",
        state: { path: ["step"], equals: "confirmed" },
        executions: { none: {} },
      },
      orderBy: { startedAt: "asc" },
      take: 4,
    });
  }

  async approve(input: ApprovedExecution) {
    return this.db.$transaction(async (tx) => {
      if (input.reservation) {
        await bookingLock(tx);
      }

      const current = await tx.workflowInstance.findUnique({ where: { id: input.instanceId } });

      if (!current || current.status !== "active" || current.revision !== input.revision) {
        return { status: "stale" } as const;
      }

      const existingExecution = await tx.workflowExecution.findFirst({
        where: { workflowInstanceId: current.id, step: { not: "failed" } },
        select: { id: true },
      });

      if (existingExecution) {
        return { status: "stale" } as const;
      }

      if (
        input.reservation &&
        (await overlappingReservation(tx, input.instanceId, input.reservation))
      ) {
        return { status: "occupied" } as const;
      }

      const updated = await tx.workflowInstance.updateMany({
        where: { id: input.instanceId, revision: input.revision, status: "active" },
        data: { revision: { increment: 1 }, state: input.acceptedState },
      });

      if (updated.count !== 1) {
        return { status: "stale" } as const;
      }

      if (input.reservation) {
        const existing = input.adopt
          ? await tx.meeting.findUnique({
              where: { googleEventId: input.reservation.googleEventId },
            })
          : null;

        if (!existing) {
          await tx.meeting.create({ data: input.reservation });
        } else if (
          existing.name !== input.reservation.name ||
          existing.email.toLowerCase() !== input.reservation.email.toLowerCase() ||
          existing.reason !== input.reservation.reason ||
          existing.timezone !== input.reservation.timezone ||
          existing.startsAt.getTime() !== input.reservation.startsAt.getTime() ||
          existing.endsAt.getTime() !== input.reservation.endsAt.getTime() ||
          !["pending", "confirmed"].includes(existing.status)
        ) {
          throw new Error("Legacy meeting does not match its approval.");
        }
      }

      await tx.workflowExecution.create({
        data: {
          id: input.id,
          workflowInstanceId: input.instanceId,
          reviewedRevision: input.revision,
          actionKey: input.actionKey,
          approvedInput: input.approvedInput,
          checkpoint: input.checkpoint,
          step: input.needsReview ? "needs_review" : "calendar",
          category: input.needsReview ? "legacy_approval_unverified" : null,
        },
      });

      return { status: "accepted", executionId: input.id } as const;
    });
  }

  async claim(now: Date, id?: string) {
    return this.db.$transaction(async (tx) => {
      const filter = id ? Prisma.sql`AND id = ${id}::uuid` : Prisma.empty;

      const [row] = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM public.workflow_executions
        WHERE step IN ('calendar', 'owner_notice') AND next_attempt_at <= ${now}
          AND attempt < ${MAX_EXECUTION_ATTEMPTS}
          AND (lease_expires_at IS NULL OR lease_expires_at <= ${now})
          ${filter}
        ORDER BY next_attempt_at, id
        LIMIT 1 FOR UPDATE SKIP LOCKED
      `;

      if (!row) {
        return null;
      }

      return tx.workflowExecution.update({
        where: { id: row.id },
        data: {
          attempt: { increment: 1 },
          leaseToken: randomUUID(),
          leaseExpiresAt: new Date(now.getTime() + LEASE_MS),
        },
      });
    });
  }

  async expireExhausted(now: Date, id?: string) {
    const exhausted = await this.db.workflowExecution.findMany({
      where: {
        id,
        step: { in: ["calendar", "owner_notice"] },
        attempt: MAX_EXECUTION_ATTEMPTS,
        leaseExpiresAt: { lte: now },
      },
      take: 8,
    });

    for (const run of exhausted) {
      const input = run.approvedInput;

      const checkpoint = run.checkpoint;

      const releaseState = meetingBookingStateSchema.safeParse(
        checkpoint && typeof checkpoint === "object" && !Array.isArray(checkpoint)
          ? checkpoint.releaseState
          : null,
      );

      const eventId =
        run.step === "calendar" &&
        !run.stepStartedAt &&
        input &&
        typeof input === "object" &&
        !Array.isArray(input) &&
        input.possiblyDispatched === false &&
        input.lookupOnly === false &&
        typeof input.eventId === "string" &&
        releaseState.success
          ? input.eventId
          : null;

      await this.settle(
        run,
        now,
        eventId
          ? { step: "failed", category: "lease_expired_before_dispatch" }
          : { step: "needs_review", category: "lease_expired_after_final_attempt" },
        eventId && releaseState.success
          ? { releaseEventId: eventId, releaseState: releaseState.data }
          : undefined,
        true,
      );
    }
  }

  async markStarted(run: WorkflowExecution, now: Date) {
    const result = await this.db.workflowExecution.updateMany({
      where: liveLease(run, now),
      data: { stepStartedAt: run.stepStartedAt ?? now },
    });

    return result.count === 1;
  }

  async settle(
    run: WorkflowExecution,
    now: Date,
    transition: Prisma.WorkflowExecutionUpdateManyMutationInput,
    effects?: {
      meeting?: MeetingRecordInput;
      releaseEventId?: string;
      releaseState?: Prisma.InputJsonObject;
      complete?: boolean;
    },
    expired = false,
  ) {
    return this.db.$transaction(async (tx) => {
      const fenced = await tx.workflowExecution.updateMany({
        where: expired
          ? { ...liveLease(run, now), leaseExpiresAt: { lte: now } }
          : liveLease(run, now),
        data: { ...transition, leaseToken: null, leaseExpiresAt: null },
      });

      if (fenced.count !== 1) {
        return false;
      }

      if (effects?.meeting) {
        const meeting = effects.meeting;

        const updated = await tx.meeting.updateMany({
          where: {
            googleEventId: meeting.googleEventId,
            status: { in: ["pending", "confirmed"] },
            name: meeting.name,
            email: { equals: meeting.email, mode: "insensitive" },
            reason: meeting.reason,
            timezone: meeting.timezone,
            startsAt: meeting.startsAt,
            endsAt: meeting.endsAt,
          },
          data: {
            status: "confirmed",
            rawProviderPayload: meeting.rawProviderPayload,
            googleEventUrl: meeting.googleEventUrl,
          },
        });

        if (updated.count !== 1) {
          throw new Error("Meeting reservation is missing or mismatched.");
        }
      }

      if (effects?.releaseEventId) {
        const released = await tx.meeting.deleteMany({
          where: { googleEventId: effects.releaseEventId, status: "pending" },
        });

        if (released.count !== 1) {
          throw new Error("Unverified meeting reservation release.");
        }
      }

      if (effects?.complete || effects?.releaseState) {
        const updated = await tx.workflowInstance.updateMany({
          where: { id: run.workflowInstanceId, status: "active" },
          data: effects.complete
            ? { status: "completed", completedAt: now, revision: { increment: 1 } }
            : { state: effects.releaseState, revision: { increment: 1 } },
        });

        if (updated.count !== 1) {
          throw new Error("Approved workflow is no longer active.");
        }
      }

      return true;
    });
  }

  meeting(eventId: string) {
    return this.db.meeting.findUnique({ where: { googleEventId: eventId } });
  }
}

function liveLease(run: WorkflowExecution, now: Date): Prisma.WorkflowExecutionWhereInput {
  if (!run.leaseToken) {
    throw new Error("Cannot update an unleased execution.");
  }

  return { id: run.id, leaseToken: run.leaseToken, leaseExpiresAt: { gt: now } };
}

async function overlappingReservation(
  tx: Prisma.TransactionClient,
  instanceId: string,
  candidate: MeetingRecordInput,
) {
  const overlap = await tx.meeting.findFirst({
    where: {
      googleEventId: { not: candidate.googleEventId },
      status: { in: ["pending", "confirmed"] },
      startsAt: { lt: candidate.endsAt },
      endsAt: { gt: candidate.startsAt },
    },
    select: { id: true },
  });

  if (overlap) {
    return true;
  }

  const holds = await tx.workflowInstance.findMany({
    where: {
      id: { not: instanceId },
      workflowId: "meeting-booking",
      status: { in: ["active", "completed"] },
      state: { path: ["step"], equals: "confirmed" },
    },
    select: { state: true },
  });

  return holds.some(({ state }) => {
    const saved = meetingBookingStateSchema.safeParse(state);

    if (!saved.success || !saved.data.selectedSlot) {
      return true;
    }

    const { start, end } = saved.data.selectedSlot;

    return (
      Date.parse(start) < candidate.endsAt.getTime() &&
      Date.parse(end) > candidate.startsAt.getTime()
    );
  });
}
