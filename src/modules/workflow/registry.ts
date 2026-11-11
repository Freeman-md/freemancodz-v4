import type { WorkflowDefinition } from "./types";

export class WorkflowRegistry {
  private readonly definitions = new Map<string, WorkflowDefinition>();

  private readonly latest = new Map<string, WorkflowDefinition>();

  constructor(definitions: readonly WorkflowDefinition[]) {
    for (const definition of definitions) {
      const { id, version } = definition;

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !Number.isSafeInteger(version) || version < 1) {
        throw new Error("Workflow definitions require a valid ID and a positive integer version.");
      }

      const key = `${id}:${version}`;

      if (this.definitions.has(key)) {
        throw new Error(`Duplicate workflow definition: ${key}`);
      }

      this.definitions.set(key, definition);

      const latest = this.latest.get(id);

      if (!latest || version > latest.version) {
        this.latest.set(id, definition);
      }
    }
  }

  get(id: string, version?: number) {
    return version === undefined ? this.latest.get(id) : this.definitions.get(`${id}:${version}`);
  }

  list() {
    return [...this.latest.values()];
  }
}
