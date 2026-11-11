import "server-only";

import {
  activeWorkflowSchema,
  workflowReviewDisplaySchema,
  type ActiveWorkflow,
  type WorkflowApproval,
  type WorkflowObservation,
} from "@/contracts/assistant.contract";
import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import type { WorkflowRegistry } from "./registry";
import type { StoredWorkflow, WorkflowRepository } from "./repository";
import type { WorkflowToolResult } from "./types";

export type ActiveWorkflowTool = {
  tool: OpenAIResponseTool;
  run(
    rawArguments: string,
    signal: AbortSignal,
  ): Promise<{ output: WorkflowToolResult["output"]; instance?: ActiveWorkflow } | null>;
};

export class WorkflowService {
  constructor(
    private readonly registry: WorkflowRegistry,
    private readonly repository: Pick<
      WorkflowRepository,
      | "startOrResume"
      | "findActive"
      | "saveState"
      | "findRun"
      | "ensureReview"
      | "findOwnedReview"
      | "approve"
    >,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  listAvailable() {
    return this.registry.list().map(({ id, description }) => ({ id, description }));
  }

  async start({
    workflowId,
    visitorKey,
    originChannel,
    signal,
  }: {
    workflowId: string;
    visitorKey: string;
    originChannel: string;
    signal: AbortSignal;
  }) {
    const definition = this.registry.get(workflowId);

    if (!definition) {
      throw new Error("The requested workflow is unavailable.");
    }

    const state = definition.stateSchema.parse(definition.createInitialState());

    signal.throwIfAborted();

    const instance = await this.repository.startOrResume({
      visitorKey,
      workflowId: definition.id,
      workflowVersion: definition.version,
      state,
      originChannel,
    });

    return this.project(instance);
  }

  async getActive(visitorKey: string): Promise<ActiveWorkflow | null> {
    const instance = await this.repository.findActive(visitorKey);

    return instance && this.registry.get(instance.workflowId, instance.workflowVersion)
      ? this.project(instance)
      : null;
  }

  async getTurn(
    visitorKey: string,
    observed?: WorkflowObservation,
  ): Promise<{
    tools: ActiveWorkflowTool[];
    guidance?: string;
    refreshed?: ActiveWorkflow;
    hasActive?: boolean;
  }> {
    const instance = await this.repository.findActive(visitorKey);

    if (!instance) {
      return { tools: [] };
    }

    const definition = this.registry.get(instance.workflowId, instance.workflowVersion);

    if (!definition) {
      return { tools: [] };
    }

    const run = await this.repository.findRun(instance.id);

    if (run) {
      const inProgress = run.status === "queued" || run.status === "running";

      return {
        tools: [],
        hasActive: inProgress,
        guidance: inProgress
          ? "The approved workflow is running. Do not change its inputs."
          : undefined,
      };
    }

    if (observed?.id !== instance.id || observed.revision !== instance.revision) {
      return {
        tools: [],
        refreshed: await this.project(instance),
        hasActive: true,
        guidance:
          "The booking details were refreshed. Ask the visitor to check them before changing the request.",
      };
    }

    return {
      hasActive: true,
      guidance: definition.getGuidance(instance.state),
      tools: definition.getTools(instance.state).map(({ tool, apply }) => ({
        tool,
        run: async (rawArguments, signal) => {
          signal.throwIfAborted();
          const args: unknown = JSON.parse(rawArguments);

          const result = await apply(instance.state, args);

          signal.throwIfAborted();

          if (result.state === undefined) {
            return { output: result.output };
          }

          const updated = await this.repository.saveState({
            id: instance.id,
            visitorKey,
            revision: instance.revision,
            state: definition.stateSchema.parse(result.state),
          });

          return updated ? { output: result.output, instance: await this.project(updated) } : null;
        },
      })),
    };
  }

  async approve(visitorKey: string, input: WorkflowApproval) {
    const review = await this.repository.findOwnedReview(input.reviewId, visitorKey);

    if (!review) {
      return { status: "not_found" } as const;
    }

    const definition = this.registry.get(review.instance.workflowId, review.version);

    const action = definition?.getAction?.(review.actionKey);

    if (
      !action ||
      review.revision !== input.expectedRevision ||
      review.version !== review.instance.workflowVersion ||
      !action.payloadSchema.safeParse(review.payload).success
    ) {
      return { status: "conflict" } as const;
    }

    const accepted = await this.repository.approve({
      id: review.id,
      instanceId: review.instanceId,
      visitorKey,
      revision: input.expectedRevision,
      version: review.version,
      steps: action.steps,
    });

    return accepted
      ? ({ status: "accepted", workflow: await this.getActive(visitorKey) } as const)
      : ({ status: "conflict" } as const);
  }

  private resolveDefinition(instance: StoredWorkflow) {
    const definition = this.registry.get(instance.workflowId, instance.workflowVersion);

    if (!definition) {
      throw new Error("The saved workflow definition is unavailable.");
    }

    return definition;
  }

  private async project(instance: StoredWorkflow): Promise<ActiveWorkflow> {
    const definition = this.resolveDefinition(instance);

    const base = {
      id: instance.id,
      revision: instance.revision,
      title: definition.title,
      status: "active",
      ...definition.getProgress(instance.state),
    };

    const run = await this.repository.findRun(instance.id);

    if (run) {
      const current = run.steps.find(({ status }) => status !== "succeeded");

      const now = this.clock();

      const retryPending =
        current?.status === "retry" ||
        (current?.status === "reconciling" &&
          (!current.claimToken || !current.claimExpires || current.claimExpires <= now));

      const completed = run.status === "finished";

      const attention = run.status === "attention";

      const action = definition.getAction?.(run.review.actionKey);

      const successful = new Set(
        run.steps.filter(({ status }) => status === "succeeded").map(({ key }) => key),
      );

      return activeWorkflowSchema.parse({
        ...base,
        status: completed ? "completed" : attention ? "attention" : "active",
        phase: completed ? "completed" : "processing",
        run: {
          status: retryPending ? "retry" : run.status,
          businessStatus: action?.getStatus(successful),
          steps: run.steps.map(({ key, label, status }) => ({
            key,
            label,
            status: key === current?.key && retryPending ? "retry" : status,
          })),
        },
      });
    }

    const proposal = definition.getReview?.(instance.state);

    const action = proposal && definition.getAction?.(proposal.actionKey);

    if (!proposal || !action) {
      return activeWorkflowSchema.parse(base);
    }

    const display = workflowReviewDisplaySchema.parse({
      label: proposal.label,
      rows: proposal.rows,
    });

    const review = await this.repository.ensureReview({
      instance,
      actionKey: proposal.actionKey,
      display,
      payload: action.payloadSchema.parse(proposal.payload),
    });

    return activeWorkflowSchema.parse(
      review?.status === "pending"
        ? {
            ...base,
            phase: "awaiting_confirmation",
            review: { id: review.id, ...workflowReviewDisplaySchema.parse(review.display) },
          }
        : base,
    );
  }
}
