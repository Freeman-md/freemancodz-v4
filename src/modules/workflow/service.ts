import "server-only";

import type { ActiveWorkflow } from "@/contracts/assistant.contract";
import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import type { WorkflowRegistry } from "./registry";
import type { StoredWorkflow, WorkflowRepository } from "./repository";

export type ActiveWorkflowTool = {
  tool: OpenAIResponseTool;
  run(rawArguments: string, signal: AbortSignal): Promise<ActiveWorkflow | null>;
};

export class WorkflowService {
  constructor(
    private readonly registry: WorkflowRegistry,
    private readonly repository: Pick<
      WorkflowRepository,
      "startOrResume" | "findActive" | "saveState"
    >,
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

  async getActiveTools(visitorKey: string): Promise<ActiveWorkflowTool[]> {
    const instance = await this.repository.findActive(visitorKey);

    if (!instance) {
      return [];
    }

    const definition = this.resolveDefinition(instance);

    return definition.getTools(instance.state).map(({ tool, apply }) => ({
      tool,
      run: async (rawArguments, signal) => {
        const args: unknown = JSON.parse(rawArguments);

        const state = definition.stateSchema.parse(apply(instance.state, args));

        signal.throwIfAborted();

        const updated = await this.repository.saveState({
          id: instance.id,
          visitorKey,
          revision: instance.revision,
          state,
        });

        return updated ? this.project(updated) : null;
      },
    }));
  }

  private resolveDefinition(instance: StoredWorkflow) {
    const definition = this.registry.get(instance.workflowId, instance.workflowVersion);

    if (!definition) {
      throw new Error("The saved workflow definition is unavailable.");
    }

    return definition;
  }

  private project(instance: StoredWorkflow): ActiveWorkflow {
    const definition = this.resolveDefinition(instance);

    return {
      id: instance.id,
      title: definition.title,
      status: "active",
      ...definition.getProgress(instance.state),
    };
  }
}
