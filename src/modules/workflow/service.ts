import "server-only";

import type { ActiveWorkflow } from "@/contracts/assistant.contract";
import type { WorkflowRegistry } from "./registry";
import type { StoredWorkflow, WorkflowRepository } from "./repository";

export class WorkflowService {
  constructor(
    private readonly registry: WorkflowRegistry,
    private readonly repository: Pick<WorkflowRepository, "startOrResume" | "findActive">,
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

    return instance ? this.project(instance) : null;
  }

  private project(instance: StoredWorkflow): ActiveWorkflow {
    const definition = this.registry.get(instance.workflowId, instance.workflowVersion);

    if (!definition) {
      throw new Error("The saved workflow definition is unavailable.");
    }

    return {
      id: instance.id,
      title: definition.title,
      status: "active",
      ...definition.projectProgress(instance.state),
    };
  }
}
