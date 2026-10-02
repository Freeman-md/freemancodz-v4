import assert from "node:assert/strict";
import test from "node:test";

import type { WorkflowInstance } from "@/generated/prisma/client";
import type { OpenAIResponseTool } from "@/infrastructure/openai/types";
import { WorkflowInstanceStoreError } from "@/modules/workflow/errors";
import type {
  IWorkflowDefinition,
  IWorkflowInstanceRepository,
} from "@/modules/workflow/interfaces";
import { WorkflowDefinitionRegistry } from "@/modules/workflow/registry";
import type {
  CreateWorkflowInstanceInput,
  SaveWorkflowInstanceInput,
} from "@/modules/workflow/types";
import { WorkflowService } from "@/modules/workflow/service";
import { CANCEL_WORKFLOW_TOOL_NAME, START_WORKFLOW_TOOL_NAME } from "@/modules/workflow/constants";
import { z } from "zod";
import { ContactWorkflowDefinition } from "@/modules/workflow/definitions/contact/contact.definition";
import { ContactWorkflowProgressProjector } from "@/modules/workflow/definitions/contact/contact.progress";
import type { AssistantPresentation } from "@/contracts/assistant-ui.contract";

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

const contactPresentation: AssistantPresentation = {
  introduction: "I can help you leave a message. What should Freeman know?",
  heading: "Your message details",
  operation: "fields",
  targetWorkflowId: null,
  controls: [
    { component: "InputField", field: "name", label: "Name", inputType: "text", options: null },
    { component: "InputField", field: "email", label: "Email", inputType: "email", options: null },
    { component: "TextArea", field: "message", label: "Message", inputType: null, options: null },
  ],
};

function contactFixture() {
  const repository = new MemoryWorkflowInstanceRepository();

  let submissions = 0;

  const contact = new ContactWorkflowDefinition(
    {
      submit: async (input) => {
        submissions++;

        return {
          ...input,
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          createdAt: new Date("2026-10-02T10:00:00Z"),
        };
      },
    },
    new ContactWorkflowProgressProjector(),
  );

  const service = new WorkflowService(
    new WorkflowDefinitionRegistry([contact, createDefinition(1)]),
    repository,
    ["present_ui"],
  );

  return { repository, service, submissions: () => submissions };
}

test("single and grouped controls bind authoritative contact constraints and share text updates", async () => {
  const { service, repository, submissions } = contactFixture();

  const instance = await service.start("contact", {
    originChannel: "web",
    originPage: null,
    originEntry: null,
  });

  await service.executeTool(instance.id, {
    name: "update_contact_context",
    rawArguments: JSON.stringify({ updates: [{ field: "name", value: "Known name" }] }),
    interactionId: INTERACTION_ID,
  });
  const single = await service.prepareInteraction(instance.id, {
    ...contactPresentation,
    controls: [contactPresentation.controls[0]],
  });

  assert.equal(single.controls[0].value, "Known name");
  assert.equal(single.controls[0].required, true);
  assert.equal(single.controls[0].maxLength, 320);
  const grouped = await service.prepareInteraction(instance.id, contactPresentation);

  assert.equal(
    (
      await service.submitInteraction(instance.id, {
        interactionId: single.id,
        revision: single.revision,
        values: { name: "Old answer" },
      })
    ).result.status,
    "stale",
  );
  const answer = {
    interactionId: grouped.id,
    revision: grouped.revision,
    values: { name: "Changed name", email: "visitor@example.test", message: "A longer enquiry" },
  };

  const invalid = await service.submitInteraction(instance.id, {
    ...answer,
    values: { ...answer.values, email: "bad" },
  });

  assert.equal(invalid.result.status, "invalid");
  assert.equal((await repository.findById(instance.id))?.revision, grouped.revision);
  assert.equal((await service.submitInteraction(instance.id, answer)).result.status, "accepted");
  assert.equal((await repository.findById(instance.id))?.pendingInteraction, null);
  assert.equal((await service.submitInteraction(instance.id, answer)).result.status, "stale");
  assert.equal(submissions(), 0);
  await service.executeTool(instance.id, {
    name: "prepare_contact_submission",
    rawArguments: "{}",
    interactionId: INTERACTION_ID,
  });
  const sameTurn = await service.executeTool(instance.id, {
    name: "submit_contact",
    rawArguments: "{}",
    interactionId: INTERACTION_ID,
  });

  assert.equal(sameTurn.output.error, "confirmation_requires_new_input");
  assert.equal(submissions(), 0);
  const structuredConfirmation = await service.executeTool(instance.id, {
    name: "submit_contact",
    rawArguments: "{}",
    interactionId: SECOND_INSTANCE_ID,
    allowConfirmation: false,
  });

  assert.equal(structuredConfirmation.output.error, "separate_confirmation_required");
  assert.equal(submissions(), 0);
  await service.executeTool(instance.id, {
    name: "submit_contact",
    rawArguments: "{}",
    interactionId: SECOND_INSTANCE_ID,
  });
  assert.equal(submissions(), 1);
});

test("unknown fields, incompatible controls and mixed workflow operations are rejected", async () => {
  const { service } = contactFixture();

  const instance = await service.start("contact", {
    originChannel: "web",
    originPage: null,
    originEntry: null,
  });

  for (const presentation of [
    { ...contactPresentation, controls: [{ ...contactPresentation.controls[0], field: "secret" }] },
    {
      ...contactPresentation,
      controls: [{ ...contactPresentation.controls[0], component: "TextArea" as const }],
    },
    {
      ...contactPresentation,
      controls: [contactPresentation.controls[0], contactPresentation.controls[0]],
    },
    {
      ...contactPresentation,
      operation: "workflow_choice" as const,
      targetWorkflowId: "test-workflow",
    },
  ]) {
    await assert.rejects(service.prepareInteraction(instance.id, presentation), {
      code: "invalid_request",
    });
  }
});

test("continue retains the instance; switch consumes one bound choice and creates one replacement", async () => {
  const { service, repository } = contactFixture();

  const instance = await service.start("contact", {
    originChannel: "web",
    originPage: null,
    originEntry: null,
  });

  const presentation: AssistantPresentation = {
    introduction: "Continue this request, or cancel it and start another?",
    heading: "Next step",
    operation: "workflow_choice",
    targetWorkflowId: "test-workflow",
    controls: [
      {
        component: "OptionSelector",
        field: "choice",
        label: "Workflow",
        inputType: null,
        options: [
          { value: "continue", label: "Continue" },
          { value: "switch", label: "Switch" },
        ],
      },
    ],
  };

  const first = await service.prepareInteraction(instance.id, presentation, "test-workflow");

  // A refreshed browser restores only the instance ID, not model conversation state.
  const restored = await service.getAssistantContext(instance.id);

  assert.match(restored.instructions, /targetWorkflowId "test-workflow"/);
  assert.match(restored.instructions, /continue\/switch/);
  assert.equal(restored.pendingWorkflowTargetId, "test-workflow");
  assert.equal(restored.inputFields, undefined);
  assert.deepEqual(restored.tools.map(({ name }) => name), ["switch_workflow"]);

  await assert.rejects(
    service.executeTool(instance.id, {
      name: "update_contact_context",
      rawArguments: "{}",
      interactionId: INTERACTION_ID,
    }),
    { code: "invalid_transition" },
  );
  const continued = await service.submitInteraction(instance.id, {
    interactionId: first.id,
    revision: first.revision,
    values: { choice: "continue" },
  });

  assert.equal(continued.instance?.id, instance.id);
  const second = await service.prepareInteraction(instance.id, presentation);

  const reply = {
    interactionId: second.id,
    revision: second.revision,
    values: { choice: "switch" },
  };

  const switched = await service.submitInteraction(instance.id, reply);

  assert.equal(switched.instance?.id, SECOND_INSTANCE_ID);
  assert.equal(switched.instance?.workflowId, "test-workflow");
  assert.equal((await repository.findById(instance.id))?.status, "cancelled");
  assert.equal((await service.submitInteraction(instance.id, reply)).result.status, "stale");
  assert.equal(repository.createCalls, 2);
});

test("text changes invalidate pending controls and unexpected submissions cannot apply", async () => {
  const { service, repository } = contactFixture();

  const instance = await service.start("contact", {
    originChannel: "web",
    originPage: null,
    originEntry: null,
  });

  const pending = await service.prepareInteraction(instance.id, {
    ...contactPresentation,
    controls: [contactPresentation.controls[0]],
  });

  assert.equal(
    (
      await service.submitInteraction(instance.id, {
        interactionId: pending.id,
        revision: pending.revision,
        values: { name: "Name", extra: "Not permitted" },
      })
    ).result.status,
    "stale",
  );
  await service.executeTool(instance.id, {
    name: "update_contact_context",
    rawArguments: JSON.stringify({ updates: [{ field: "name", value: "Text answer" }] }),
    interactionId: INTERACTION_ID,
  });
  assert.equal(
    (
      await service.submitInteraction(instance.id, {
        interactionId: pending.id,
        revision: pending.revision,
        values: { name: "Form answer" },
      })
    ).result.status,
    "stale",
  );
  assert.equal((await repository.findById(instance.id))?.pendingInteraction, null);
});

function createDefinition(
  version: number,
  options: {
    initialCount?: number;
    invalidReturnedCount?: boolean;
    toolName?: string;
  } = {},
): IWorkflowDefinition<TestState> {
  return {
    id: "test-workflow",
    version,
    description: "Exercise the generic workflow lifecycle.",
    stateSchema: StateSchema,
    createInitialState: () => ({ step: "collecting", count: options.initialCount ?? 0 }),
    getProgress: (state, status) => ({
      phase: status === "active" ? "collecting" : status,
      fields: [{ key: "count", required: true, value: String(state.count) }],
      missingRequiredFields: [],
    }),
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
    progress: {
      phase: "collecting",
      fields: [{ key: "count", required: true, value: "0" }],
      missingRequiredFields: [],
    },
  });

  const stored = await repository.findById(FIRST_INSTANCE_ID);

  assert.equal(stored?.originChannel, "web");
  assert.equal(stored?.originPage, "/work");
  assert.equal(stored?.originEntry, "project-cta");
  assert.deepEqual(stored?.state, { step: "collecting", count: 0 });

  const active = await service.getAssistantContext(FIRST_INSTANCE_ID);

  assert.equal(active.instructions.split("\n")[0], "version-2-collecting");
  assert.match(active.instructions, /no structured field capabilities/);
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

  assert.equal(context.instructions.split("\n")[0], "version-1-collecting");
  assert.match(context.instructions, /Collect its details through ordinary chat/);
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
  assert.equal(completed.instance.progress.phase, "completed");
  assert.equal((await repository.findById(FIRST_INSTANCE_ID))?.completedAt, completedAt);
  assert.equal(cancelled.instance.status, "cancelled");
  assert.equal(cancelled.instance.progress.phase, "cancelled");
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
    pendingInteraction: null,
    revision: 0,
    originChannel: "web",
    originPage: null,
    originEntry: null,
    startedAt: timestamp,
    completedAt: null,
    updatedAt: timestamp,
    ...overrides,
  };
}

class MemoryWorkflowInstanceRepository implements IWorkflowInstanceRepository {
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
      pendingInteraction: null,
      revision: 0,
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

    if (current.revision !== input.expectedRevision) {
      throw new WorkflowInstanceStoreError("stale", "changed");
    }

    this.saveCalls += 1;
    const saved: WorkflowInstance = {
      ...current,
      revision: current.revision + 1,
      pendingInteraction: input.pendingInteraction ?? null,
      status: input.status,
      state: input.state,
      completedAt: input.completedAt,
      updatedAt: new Date("2026-08-20T11:00:00.000Z"),
    };

    this.instances.set(input.id, saved);

    if (input.replacement) {
      return this.create(input.replacement);
    }

    return saved;
  }
}
