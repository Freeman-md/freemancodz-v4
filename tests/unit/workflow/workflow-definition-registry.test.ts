import assert from "node:assert/strict";
import test from "node:test";

import type { OpenAIResponseTool } from "@/server/infrastructure/openai/models/openai-response-request";
import type { IWorkflowDefinition } from "@/server/modules/workflow/interfaces/workflow-definition.interface";
import { WorkflowDefinitionRegistry } from "@/server/modules/workflow/models/workflow-definition-registry";
import { z } from "zod";

const StateSchema = z.object({ step: z.string() }).strict();

type TestState = z.infer<typeof StateSchema>;

function createDefinition(id: string, version: number): IWorkflowDefinition<TestState> {
  return {
    id,
    version,
    description: `${id} version ${version}`,
    stateSchema: StateSchema,
    createInitialState: () => ({ step: "initial" }),
    getInstructions: () => `instructions-${version}`,
    getTools: (): OpenAIResponseTool[] => [],
    executeTool: async (_name, _rawArguments, state) => ({
      state,
      status: "active",
      output: { message: "unchanged" },
    }),
  };
}

test("resolves exact versions while routing new starts to the deterministic latest version", () => {
  const first = createDefinition("alpha", 1);

  const second = createDefinition("alpha", 2);

  const other = createDefinition("beta", 3);

  const registry = new WorkflowDefinitionRegistry([second, other, first]);

  assert.equal(registry.get("alpha", 1), first);
  assert.equal(registry.get("alpha", 2), second);
  assert.equal(registry.getLatest("alpha"), second);
  assert.deepEqual(
    registry.listRoutable().map((definition) => [definition.id, definition.version]),
    [
      ["alpha", 2],
      ["beta", 3],
    ],
  );
});

test("rejects duplicate identity pairs and non-positive versions", () => {
  assert.throws(
    () =>
      new WorkflowDefinitionRegistry([
        createDefinition("duplicate", 1),
        createDefinition("duplicate", 1),
      ]),
    /Duplicate workflow definition/,
  );

  assert.throws(
    () => new WorkflowDefinitionRegistry([createDefinition("invalid", 0)]),
    /positive integer version/,
  );
});
