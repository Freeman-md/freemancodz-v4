import type { IWorkflowDefinition } from "../interfaces/workflow-definition.interface";

export class WorkflowDefinitionRegistry {
  private readonly definitionsByKey: ReadonlyMap<string, IWorkflowDefinition>;

  private readonly latestById: ReadonlyMap<string, IWorkflowDefinition>;

  private readonly routableDefinitions: readonly IWorkflowDefinition[];

  constructor(definitions: readonly IWorkflowDefinition[]) {
    const definitionsByKey = new Map<string, IWorkflowDefinition>();

    const latestById = new Map<string, IWorkflowDefinition>();

    for (const definition of definitions) {
      validateDefinitionIdentity(definition);

      const key = definitionKey(definition.id, definition.version);

      if (definitionsByKey.has(key)) {
        throw new Error(
          `Duplicate workflow definition: ${definition.id} version ${definition.version}.`,
        );
      }

      definitionsByKey.set(key, definition);

      const latest = latestById.get(definition.id);

      if (!latest || definition.version > latest.version) {
        latestById.set(definition.id, definition);
      }
    }

    this.definitionsByKey = definitionsByKey;
    this.latestById = latestById;
    this.routableDefinitions = Object.freeze(
      [...latestById.values()].sort((left, right) => left.id.localeCompare(right.id)),
    );
  }

  get(workflowId: string, version: number): IWorkflowDefinition | undefined {
    return this.definitionsByKey.get(definitionKey(workflowId, version));
  }

  getLatest(workflowId: string): IWorkflowDefinition | undefined {
    return this.latestById.get(workflowId);
  }

  listRoutable(): readonly IWorkflowDefinition[] {
    return this.routableDefinitions;
  }
}

function definitionKey(workflowId: string, version: number): string {
  return `${workflowId}\u0000${version}`;
}

function validateDefinitionIdentity(definition: IWorkflowDefinition): void {
  if (!definition.id || definition.id.trim() !== definition.id) {
    throw new Error("Workflow definition IDs must be non-empty and cannot have outer whitespace.");
  }

  if (!Number.isInteger(definition.version) || definition.version <= 0) {
    throw new Error(`Workflow definition ${definition.id} must have a positive integer version.`);
  }

  if (!definition.description.trim()) {
    throw new Error(`Workflow definition ${definition.id} must have a description.`);
  }
}
