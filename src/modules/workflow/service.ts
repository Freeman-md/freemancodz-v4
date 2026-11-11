import "server-only";

import type { WorkflowRegistry } from "./registry";
import type { WorkflowRepository } from "./repository";

export class WorkflowService {
  constructor(
    private readonly registry: WorkflowRegistry,
    private readonly repository: Pick<WorkflowRepository, "create">,
  ) {}

  async start(workflowId: string, originChannel: string, signal: AbortSignal) {
    const definition = this.registry.get(workflowId);

    if (!definition) {
      throw new Error("The requested workflow is unavailable.");
    }

    const state = definition.stateSchema.parse(definition.createInitialState());

    signal.throwIfAborted();

    return this.repository.create({
      workflowId: definition.id,
      workflowVersion: definition.version,
      state,
      originChannel,
    });
  }
}
