import "server-only";

import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient, WorkflowStep } from "@/generated/prisma/client";

const CLAIM_MS = 45_000;

export const WORKFLOW_ATTEMPTS = 3;

export const WORKFLOW_BACKOFF_MS = [60_000, 300_000] as const;

export class WorkflowRunRepository {
  constructor(private readonly prisma: PrismaClient) {}

  claim(now: Date) {
    return this.prisma.$transaction(async (tx) => {
      const [candidate] = await tx.$queryRaw<WorkflowStep[]>`
        SELECT s.id, s.status, s.attempts, s.probes, s.run_id AS "runId",
               s.claim_token AS "claimToken"
        FROM workflow_steps s
        JOIN workflow_runs r ON r.id = s.run_id
        WHERE r.status IN ('queued', 'running')
          AND ((s.status IN ('queued', 'retry', 'reconciling') AND s.claim_token IS NULL AND s.next_at <= ${now})
            OR (s.status = 'running' AND s.claim_expires <= ${now})
            OR (s.status = 'reconciling' AND s.claim_expires <= ${now} AND s.next_at <= ${now}))
          AND NOT EXISTS (
            SELECT 1 FROM workflow_steps earlier
            WHERE earlier.run_id = s.run_id AND earlier.position < s.position
              AND earlier.status <> 'succeeded'
          )
        ORDER BY s.next_at, r.created_at, s.position
        LIMIT 1 FOR UPDATE OF s SKIP LOCKED
      `;

      if (!candidate) {
        return null;
      }

      const reconcile = candidate.status === "running" || candidate.status === "reconciling";

      if ((reconcile ? candidate.probes : candidate.attempts) >= WORKFLOW_ATTEMPTS) {
        await tx.workflowStep.update({
          where: { id: candidate.id },
          data: {
            status: "attention",
            claimToken: null,
            claimExpires: null,
            reason: "attempts_exhausted",
          },
        });
        await finishRun(tx, candidate.runId, "attention", now);

        return { status: "exhausted" } as const;
      }

      await tx.workflowRun.update({ where: { id: candidate.runId }, data: { status: "running" } });
      const step = await tx.workflowStep.update({
        where: { id: candidate.id },
        data: {
          claimToken: randomUUID(),
          claimExpires: new Date(now.getTime() + CLAIM_MS),
          status: reconcile ? "reconciling" : "running",
          ...(reconcile
            ? {
                probes: { increment: 1 },
                // If a worker disappears, its successor still observes this probe's delay.
                nextAt: new Date(now.getTime() + (WORKFLOW_BACKOFF_MS[candidate.probes] ?? 0)),
              }
            : { attempts: { increment: 1 } }),
        },
        include: {
          run: {
            include: {
              review: {
                include: { instance: { select: { workflowId: true, workflowVersion: true } } },
              },
              steps: { where: { status: "succeeded" }, select: { key: true, outcome: true } },
            },
          },
        },
      });

      return { status: "claimed", step, reconcile } as const;
    });
  }

  checkpoint(
    step: WorkflowStep,
    value: Prisma.InputJsonObject,
    now: Date,
    persist?: (transaction: Prisma.TransactionClient) => Promise<void>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.workflowStep.updateMany({
        where: claimFilter(step, now),
        data: { checkpoint: value },
      });

      if (result.count !== 1) {
        return false;
      }

      await persist?.(tx);

      return true;
    });
  }

  async markEffect(step: WorkflowStep, now: Date) {
    const result = await this.prisma.workflowStep.updateMany({
      where: claimFilter(step, now),
      data: { firstEffect: step.firstEffect ?? now },
    });

    return result.count === 1;
  }

  settle(
    step: WorkflowStep,
    transition: {
      status: "retry" | "reconciling" | "succeeded" | "attention";
      reason?: string;
      nextAt?: Date;
      outcome?: Prisma.InputJsonObject;
    },
    now: Date,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const saved = await tx.workflowStep.updateMany({
        where: claimFilter(step, now),
        data: {
          ...transition,
          reason: transition.reason ?? null,
          claimToken: null,
          claimExpires: null,
        },
      });

      if (saved.count !== 1) {
        return false;
      }

      if (transition.status === "attention") {
        await finishRun(tx, step.runId, "attention", now);
      } else if (transition.status === "succeeded") {
        const [next] = await tx.workflowStep.updateManyAndReturn({
          where: { runId: step.runId, position: step.position + 1, status: "queued" },
          data: { nextAt: now },
          select: { id: true },
        });

        if (!next) {
          await finishRun(tx, step.runId, "finished", now);
        }
      }

      return true;
    });
  }
}

function claimFilter(step: WorkflowStep, now: Date) {
  if (!step.claimToken) {
    throw new Error("Workflow step has no claim.");
  }

  return { id: step.id, claimToken: step.claimToken, claimExpires: { gt: now } };
}

async function finishRun(
  tx: Prisma.TransactionClient,
  id: string,
  status: "finished" | "attention",
  now: Date,
) {
  const run = await tx.workflowRun.update({
    where: { id },
    data: { status },
    select: { review: { select: { instanceId: true } } },
  });

  await tx.workflowInstance.update({
    where: { id: run.review.instanceId },
    data: { status: "completed", completedAt: now },
  });
}
