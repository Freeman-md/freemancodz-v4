import type { IWorkflowDefinition } from "./interfaces/workflow-definition.interface";

export class WorkflowDefinitionRegistry {
  private readonly definitions = new Map<string, IWorkflowDefinition>();

  private readonly latest = new Map<string, IWorkflowDefinition>();

  constructor(definitions: readonly IWorkflowDefinition[]) {
    for (const definition of definitions) {
      if (
        !definition.id.trim() ||
        !Number.isInteger(definition.version) ||
        definition.version <= 0
      ) {
        throw new Error("Workflow definitions require an ID and positive integer version.");
      }

      const key = definitionKey(definition.id, definition.version);

      if (this.definitions.has(key)) {
        throw new Error(
          `Duplicate workflow definition: ${definition.id} version ${definition.version}.`,
        );
      }

      this.definitions.set(key, definition);

      const latest = this.latest.get(definition.id);

      if (!latest || definition.version > latest.version) {
        this.latest.set(definition.id, definition);
      }
    }
  }

  get(workflowId: string, version: number): IWorkflowDefinition | undefined {
    return this.definitions.get(definitionKey(workflowId, version));
  }

  getLatest(workflowId: string): IWorkflowDefinition | undefined {
    return this.latest.get(workflowId);
  }

  listRoutable(): readonly IWorkflowDefinition[] {
    return [...this.latest.values()].sort((left, right) => left.id.localeCompare(right.id));
  }
}

function definitionKey(workflowId: string, version: number): string {
  return `${workflowId}\u0000${version}`;
}
