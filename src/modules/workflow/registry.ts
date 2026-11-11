import type { WorkflowDefinition } from "./types";

export class WorkflowRegistry {
  private readonly definitions = new Map<string, WorkflowDefinition>();

  constructor(definitions: readonly WorkflowDefinition[]) {
    for (const definition of definitions) {
      const { id, version } = definition;

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !Number.isSafeInteger(version) || version < 1) {
        throw new Error("Workflow definitions require a valid ID and a positive integer version.");
      }

      if (this.definitions.has(id)) {
        throw new Error(`Duplicate workflow ID: ${id}`);
      }

      this.definitions.set(id, definition);
    }
  }

  get(id: string) {
    return this.definitions.get(id);
  }
}
