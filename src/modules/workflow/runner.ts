import "server-only";

import type { WorkflowStep } from "@/generated/prisma/client";
import type { AssistantActivity } from "@/contracts/assistant.contract";
import type { Logger } from "@/infrastructure/logging/logger";
import type { WorkflowRegistry } from "./registry";
import {
  WORKFLOW_ATTEMPTS,
  WORKFLOW_BACKOFF_MS,
  type WorkflowRunRepository,
} from "./run-repository";
import type { WorkflowProbeResult, WorkflowStepInput, WorkflowStepResult } from "./types";

export class WorkflowRunner {
  constructor(
    private readonly registry: WorkflowRegistry,
    private readonly repository: WorkflowRunRepository,
    private readonly logger: Logger,
    private readonly clock: () => Date = () => new Date(),
    private readonly batchSize = 4,
  ) {}

  async runDue(reviewId?: string, onActivity?: (activity: AssistantActivity) => void) {
    const signal = AbortSignal.timeout(20_000);

    let handled = 0;

    function report(label: string, status: AssistantActivity["status"]) {
      try {
        onActivity?.({ type: "activity", label, status });
      } catch {
        // An observer can disappear while the durable step is in flight.
      }
    }

    while (handled < this.batchSize && !signal.aborted) {
      const claim = await this.repository.claim(this.clock(), reviewId);

      if (!claim) {
        break;
      }

      handled += 1;

      if (claim.status === "exhausted") {
        report("Working on your request", claim.uncertain ? "uncertain" : "failed");
        continue;
      }

      const { step, reconcile } = claim;

      const { review, steps } = step.run;

      const definition = this.registry.get(review.instance.workflowId, review.version);

      const action = definition?.getAction?.(review.actionKey);

      const handler = action?.steps[step.position];

      const payload = action?.payloadSchema.safeParse(review.payload);

      if (
        handler?.key !== step.key ||
        !payload?.success ||
        review.version !== review.instance.workflowVersion
      ) {
        const saved = await this.repository.settle(
          step,
          {
            status: "attention",
            reason: "definition_unavailable",
            outcome: { certainty: step.firstEffect ? "uncertain" : "failure" },
          },
          this.clock(),
        );

        if (saved) {
          report("Working on your request", step.firstEffect ? "uncertain" : "failed");
        }

        continue;
      }

      const label = handler.activityLabel ?? "Working on your request";

      const now = this.clock();

      const context: WorkflowStepInput = {
        id: step.id,
        runId: step.runId,
        payload: payload.data,
        previous: new Map(steps.map(({ key, outcome }) => [key, outcome])),
        firstEffect: step.firstEffect ?? now,
        clock: this.clock,
        signal,
        checkpoint: step.checkpoint,
        saveCheckpoint: (value, persist) =>
          this.repository.checkpoint(step, value, this.clock(), persist),
      };

      let result: WorkflowStepResult | WorkflowProbeResult;

      try {
        if (reconcile) {
          report(label, "checking");
          result = step.firstEffect ? await handler.reconcile(context) : { kind: "safe" };
        } else if (await this.repository.markEffect(step, now)) {
          report(label, step.attempts > 1 ? "retrying" : "started");
          result = await handler.execute(context);
        } else {
          continue;
        }
      } catch {
        result = { kind: "uncertain", reason: "step_unavailable" };
      }

      const transition = this.transition(step, result, reconcile);

      const saved = await this.repository.settle(step, transition, this.clock());

      if (!saved) {
        continue;
      }

      switch (transition.status) {
        case "succeeded":
          report(label, "finished");
          break;
        case "retry":
          report(label, "retry_scheduled");
          break;
        case "reconciling":
          report(label, reconcile ? "check_scheduled" : "uncertain");
          break;
        case "attention":
          report(label, transition.outcome.certainty === "failure" ? "failed" : "uncertain");
          break;
      }

      if ("reason" in result) {
        this.logger.info("workflow.step_result", {
          runId: step.runId,
          step: step.key,
          attempt: step.attempts,
          probe: step.probes,
          reason: result.reason,
        });
      }
    }

    return { handled };
  }

  private transition(
    step: WorkflowStep,
    result: WorkflowStepResult | WorkflowProbeResult,
    reconcile: boolean,
  ) {
    const now = this.clock();

    switch (result.kind) {
      case "success":
        return { status: "succeeded", outcome: result.outcome } as const;
      case "terminal":
        return {
          status: "attention",
          reason: result.reason,
          outcome: { certainty: result.definiteFailure ? "failure" : "uncertain" },
        } as const;
      case "safe":
      case "retry":
        return step.attempts >= WORKFLOW_ATTEMPTS
          ? ({
              status: "attention",
              reason: "execution_exhausted",
              outcome: { certainty: "failure" },
            } as const)
          : ({
              status: "retry",
              reason: result.kind === "retry" ? result.reason : undefined,
              nextAt: new Date(now.getTime() + WORKFLOW_BACKOFF_MS[step.attempts - 1]),
            } as const);
      case "uncertain":
        return reconcile && step.probes >= WORKFLOW_ATTEMPTS
          ? ({
              status: "attention",
              reason: result.reason,
              outcome: { certainty: "uncertain" },
            } as const)
          : ({
              status: "reconciling",
              reason: result.reason,
              nextAt: new Date(
                now.getTime() + (reconcile ? WORKFLOW_BACKOFF_MS[step.probes - 1] : 0),
              ),
            } as const);
    }
  }
}
