import assert from "node:assert/strict";
import test from "node:test";

import type { WorkflowInstance } from "@/generated/prisma/client";
import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import type { WorkflowInstanceStore } from "@/modules/workflow/types";
import { WorkflowInstanceStoreError } from "@/modules/workflow/types";
import type { WorkflowDefinition } from "@/modules/workflow/types";
import { WorkflowDefinitionRegistry } from "@/modules/workflow/registry";
import type {
  CreateWorkflowInstanceInput,
  SaveWorkflowInstanceInput,
} from "@/modules/workflow/types";
import { WorkflowService } from "@/modules/workflow/service";
import {
  CANCEL_WORKFLOW_TOOL_NAME,
  START_WORKFLOW_TOOL_NAME,
} from "@/modules/workflow/constants";
import { z } from "zod";

const FIRST_INSTANCE_ID = "11111111-1111-4111-8111-111111111111";

const SECOND_INSTANCE_ID = "22222222-2222-4222-8222-222222222222";

const INTERACTION_ID = "33333333-3333-4333-8333-333333333333";

const StateSchema = z
  .object({
    step: z.enum(["collecting", "ready"]),
    count: z.number().int().nonnegative(),
  })
  .strict();

type TestState = z.infer<typeof StateSchema>;

const ADVANCE_TOOL = createTool("advance_test");

const COMPLETE_TOOL = createTool("complete_test");

function createDefinition(
  version: number,
  options: {
    initialCount?: number;
    invalidReturnedCount?: boolean;
    toolName?: string;
  } = {},
): WorkflowDefinition<TestState> {
  return {
    id: "test-workflow",
    version,
    description: "Exercise the generic workflow lifecycle.",
    stateSchema: StateSchema,
    createInitialState: () => ({ step: "collecting", count: options.initialCount ?? 0 }),
    getInstructions: (state) => `version-${version}-${state.step}`,
    getTools: (state) => {
      if (options.toolName) {
        return [createTool(options.toolName)];
      }

      return state.step === "collecting" ? [ADVANCE_TOOL] : [COMPLETE_TOOL];
    },
    executeTool: async (name, _rawArguments, state) => {
      if (options.invalidReturnedCount) {
        return {
          state: { ...state, count: -1 },
          status: "active",
          output: { message: "invalid" },
        };
      }

      if (name === "advance_test") {
        return {
          state: { step: "ready", count: state.count + 1 },
          status: "active",
          output: { message: "advanced" },
        };
      }

      return {
        state,
        status: "completed",
        output: { message: "completed" },
      };
    },
  };
}

test("starts the latest version with supplied origin and exposes only safe public context", async () => {
  const repository = new MemoryWorkflowInstanceRepository();

  const registry = new WorkflowDefinitionRegistry([createDefinition(1), createDefinition(2)]);

  assert.equal(registry.get("test-workflow", 1)?.version, 1);
  assert.equal(registry.getLatest("test-workflow")?.version, 2);
  assert.throws(
    () => new WorkflowDefinitionRegistry([createDefinition(1), createDefinition(1)]),
    /Duplicate workflow definition/,
  );
  assert.throws(
    () => new WorkflowDefinitionRegistry([createDefinition(0)]),
    /positive integer version/,
  );

  const service = new WorkflowService(registry, repository, ["search_website"]);

  const idle = await service.getAssistantContext(null);

  assert.deepEqual(
    idle.tools.map((tool) => tool.name),
    [START_WORKFLOW_TOOL_NAME],
  );
  assert.equal(idle.instance, null);

  const result = await service.executeTool(null, {
    name: START_WORKFLOW_TOOL_NAME,
    rawArguments: JSON.stringify({ workflowId: "test-workflow" }),
    interactionId: INTERACTION_ID,
    startContext: {
      originChannel: "web",
      originPage: "/work",
      originEntry: "project-cta",
    },
  });

  assert.deepEqual(result.instance, {
    id: FIRST_INSTANCE_ID,
    workflowId: "test-workflow",
    workflowVersion: 2,
    status: "active",
  });

  const stored = await repository.findById(FIRST_INSTANCE_ID);

  assert.equal(stored?.originChannel, "web");
  assert.equal(stored?.originPage, "/work");
  assert.equal(stored?.originEntry, "project-cta");
  assert.deepEqual(stored?.state, { step: "collecting", count: 0 });

  const active = await service.getAssistantContext(FIRST_INSTANCE_ID);

  assert.equal(active.instructions, "version-2-collecting");
  assert.deepEqual(
    active.tools.map((tool) => tool.name),
    [CANCEL_WORKFLOW_TOOL_NAME, "advance_test"],
  );
  assert.deepEqual(active.instance, result.instance);
  assert.equal("state" in active.instance!, false);
});

test("resolves an existing instance's exact version after a newer version is registered", async () => {
  const repository = new MemoryWorkflowInstanceRepository();

  repository.seed(createInstance({ workflowVersion: 1 }));
  const service = new WorkflowService(
    new WorkflowDefinitionRegistry([createDefinition(1), createDefinition(2)]),
    repository,
    [],
  );

  const context = await service.getAssistantContext(FIRST_INSTANCE_ID);

  assert.equal(context.instructions, "version-1-collecting");
});

test("rejects nested starts and stale tools without persisting a second transition", async () => {
  const repository = new MemoryWorkflowInstanceRepository();

  repository.seed(createInstance());
  const service = new WorkflowService(
    new WorkflowDefinitionRegistry([createDefinition(1)]),
    repository,
    [],
  );

  await assert.rejects(
    service.executeTool(FIRST_INSTANCE_ID, {
      name: START_WORKFLOW_TOOL_NAME,
      rawArguments: JSON.stringify({ workflowId: "test-workflow" }),
      interactionId: INTERACTION_ID,
      startContext: { originChannel: "web", originPage: null, originEntry: null },
    }),
    { code: "invalid_transition" },
  );

  await service.executeTool(FIRST_INSTANCE_ID, {
    name: "advance_test",
    rawArguments: "{}",
    interactionId: INTERACTION_ID,
  });

  await assert.rejects(
    service.executeTool(FIRST_INSTANCE_ID, {
      name: "advance_test",
      rawArguments: "{}",
      interactionId: INTERACTION_ID,
    }),
    { code: "unavailable_tool" },
  );

  assert.equal(repository.saveCalls, 1);
});

test("rejects invalid initial and returned state before persistence", async () => {
  const invalidInitialRepository = new MemoryWorkflowInstanceRepository();

  const invalidInitialService = new WorkflowService(
    new WorkflowDefinitionRegistry([createDefinition(1, { initialCount: -1 })]),
    invalidInitialRepository,
    [],
  );

  await assert.rejects(
    invalidInitialService.start("test-workflow", {
      originChannel: "web",
      originPage: null,
      originEntry: null,
    }),
    { code: "invalid_state" },
  );
  assert.equal(invalidInitialRepository.createCalls, 0);

  const invalidReturnedRepository = new MemoryWorkflowInstanceRepository();

  invalidReturnedRepository.seed(createInstance());
  const invalidReturnedService = new WorkflowService(
    new WorkflowDefinitionRegistry([createDefinition(1, { invalidReturnedCount: true })]),
    invalidReturnedRepository,
    [],
  );

  await assert.rejects(
    invalidReturnedService.executeTool(FIRST_INSTANCE_ID, {
      name: "advance_test",
      rawArguments: "{}",
      interactionId: INTERACTION_ID,
    }),
    { code: "invalid_state" },
  );
  assert.equal(invalidReturnedRepository.saveCalls, 0);
});

test("persists completion and cancellation as terminal states and rejects later execution", async () => {
  const completedAt = new Date("2026-08-20T12:00:00.000Z");

  const repository = new MemoryWorkflowInstanceRepository();

  repository.seed(createInstance({ state: { step: "ready", count: 1 } }));
  repository.seed(createInstance({ id: SECOND_INSTANCE_ID }));
  const service = new WorkflowService(
    new WorkflowDefinitionRegistry([createDefinition(1)]),
    repository,
    [],
    () => completedAt,
  );

  const completed = await service.executeTool(FIRST_INSTANCE_ID, {
    name: "complete_test",
    rawArguments: "{}",
    interactionId: INTERACTION_ID,
  });

  const cancelled = await service.executeTool(SECOND_INSTANCE_ID, {
    name: CANCEL_WORKFLOW_TOOL_NAME,
    rawArguments: "{}",
    interactionId: INTERACTION_ID,
  });

  assert.equal(completed.instance.status, "completed");
  assert.equal((await repository.findById(FIRST_INSTANCE_ID))?.completedAt, completedAt);
  assert.equal(cancelled.instance.status, "cancelled");
  assert.equal((await repository.findById(SECOND_INSTANCE_ID))?.completedAt, null);

  await assert.rejects(
    service.executeTool(FIRST_INSTANCE_ID, {
      name: "complete_test",
      rawArguments: "{}",
      interactionId: INTERACTION_ID,
    }),
    { code: "invalid_transition" },
  );
  await assert.rejects(service.cancel(SECOND_INSTANCE_ID), { code: "invalid_transition" });
});

test("fails safely for unknown instances, missing definitions, and corrupt stored state", async () => {
  const repository = new MemoryWorkflowInstanceRepository();

  const service = new WorkflowService(
    new WorkflowDefinitionRegistry([createDefinition(1)]),
    repository,
    [],
  );

  await assert.rejects(service.getAssistantContext(FIRST_INSTANCE_ID), { code: "not_found" });

  repository.seed(createInstance({ workflowVersion: 99 }));
  await assert.rejects(service.getAssistantContext(FIRST_INSTANCE_ID), {
    code: "unavailable_definition",
  });

  repository.seed(createInstance({ state: { step: "collecting", count: -1 } }));
  await assert.rejects(service.getAssistantContext(FIRST_INSTANCE_ID), { code: "invalid_state" });
});

test("rejects collisions across global, control, and definition tool names", async () => {
  assert.throws(
    () =>
      new WorkflowService(
        new WorkflowDefinitionRegistry([createDefinition(1)]),
        new MemoryWorkflowInstanceRepository(),
        [START_WORKFLOW_TOOL_NAME],
      ),
    { code: "configuration_error" },
  );

  const repository = new MemoryWorkflowInstanceRepository();

  const service = new WorkflowService(
    new WorkflowDefinitionRegistry([createDefinition(1, { toolName: "search_website" })]),
    repository,
    ["search_website"],
  );

  await assert.rejects(
    service.start("test-workflow", {
      originChannel: "web",
      originPage: null,
      originEntry: null,
    }),
    { code: "configuration_error" },
  );
  assert.equal(repository.createCalls, 0);
});

function createTool(name: string): OpenAIResponseTool {
  return {
    type: "function",
    name,
    description: `${name} test tool`,
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      required: [],
      properties: {},
    },
  };
}

function createInstance(overrides: Partial<WorkflowInstance> = {}): WorkflowInstance {
  const timestamp = new Date("2026-08-20T10:00:00.000Z");

  return {
    id: FIRST_INSTANCE_ID,
    workflowId: "test-workflow",
    workflowVersion: 1,
    status: "active",
    state: { step: "collecting", count: 0 },
    originChannel: "web",
    originPage: null,
    originEntry: null,
    startedAt: timestamp,
    completedAt: null,
    updatedAt: timestamp,
    ...overrides,
  };
}

class MemoryWorkflowInstanceRepository implements WorkflowInstanceStore {
  private readonly instances = new Map<string, WorkflowInstance>();

  createCalls = 0;

  saveCalls = 0;

  seed(instance: WorkflowInstance): void {
    this.instances.set(instance.id, instance);
  }

  async create(input: CreateWorkflowInstanceInput): Promise<WorkflowInstance> {
    this.createCalls += 1;
    const id = this.instances.has(FIRST_INSTANCE_ID) ? SECOND_INSTANCE_ID : FIRST_INSTANCE_ID;

    const timestamp = new Date("2026-08-20T10:00:00.000Z");

    const instance: WorkflowInstance = {
      id,
      ...input,
      status: "active",
      startedAt: timestamp,
      completedAt: null,
      updatedAt: timestamp,
    };

    this.instances.set(id, instance);

    return instance;
  }

  async findById(id: string): Promise<WorkflowInstance | null> {
    return this.instances.get(id) ?? null;
  }

  async save(input: SaveWorkflowInstanceInput): Promise<WorkflowInstance> {
    const current = this.instances.get(input.id);

    if (!current) {
      throw new WorkflowInstanceStoreError("not_found", "not found");
    }

    if (current.status !== "active") {
      throw new WorkflowInstanceStoreError("terminal", "terminal");
    }

    this.saveCalls += 1;
    const saved: WorkflowInstance = {
      ...current,
      status: input.status,
      state: input.state,
      completedAt: input.completedAt,
      updatedAt: new Date("2026-08-20T11:00:00.000Z"),
    };

    this.instances.set(input.id, saved);

    return saved;
  }
}
