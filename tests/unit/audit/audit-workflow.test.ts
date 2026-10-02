import assert from "node:assert/strict";
import test from "node:test";

import type { AuditRequest, WorkflowInstance } from "@/generated/prisma/client";
import type { AuditService } from "@/modules/audit/service";
import type { IWorkflowInstanceRepository } from "@/modules/workflow/interfaces";
import { AuditWorkflowDefinition } from "@/modules/workflow/definitions/audit/audit.definition";
import { AuditWorkflowProgressProjector } from "@/modules/workflow/definitions/audit/audit.progress";
import { WorkflowDefinitionRegistry } from "@/modules/workflow/registry";
import type {
  CreateWorkflowInstanceInput,
  SaveWorkflowInstanceInput,
  WorkflowExecutionContext,
} from "@/modules/workflow/types";
import { WorkflowService } from "@/modules/workflow/service";

const INSTANCE_ID = "11111111-1111-4111-8111-111111111111";

const auditWorkflowProgress = new AuditWorkflowProgressProjector();

const PREPARATION_CONTEXT: WorkflowExecutionContext = {
  workflowInstanceId: INSTANCE_ID,
  interactionId: "22222222-2222-4222-8222-222222222222",
};

const CONFIRMATION_CONTEXT: WorkflowExecutionContext = {
  workflowInstanceId: INSTANCE_ID,
  interactionId: "33333333-3333-4333-8333-333333333333",
};

const COMPLETE_UPDATES = [
  { field: "focus", value: "Customer onboarding" },
  { field: "currentProcess", value: "A form is copied into a shared inbox." },
  { field: "friction", value: "Follow-up depends on someone noticing the email." },
  { field: "desiredOutcome", value: "Every customer receives a prompt next step." },
  { field: "name", value: "Visitor" },
  { field: "email", value: "visitor@example.com" },
] as const;

function createAuditService() {
  const requests = new Map<string, AuditRequest>();

  let submitCalls = 0;

  const service: Pick<AuditService, "submit" | "listRequests"> = {
    submit: async (input) => {
      submitCalls += 1;
      const existing = requests.get(input.workflowInstanceId);

      if (existing) {
        return existing;
      }

      const request: AuditRequest = {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        createdAt: new Date("2026-08-20T12:00:00.000Z"),
        ...input,
      };

      requests.set(input.workflowInstanceId, request);

      return request;
    },
    listRequests: async () => [...requests.values()],
  };

  return {
    service,
    get createdCount() {
      return requests.size;
    },
    get submitCalls() {
      return submitCalls;
    },
  };
}

test("one update records several fields and reports only remaining required details", async () => {
  const audit = createAuditService();

  const definition = new AuditWorkflowDefinition(audit.service, auditWorkflowProgress);

  const initial = definition.createInitialState({
    originChannel: "web",
    originPage: "/",
    originEntry: "home-audit-cta",
  });

  const updated = await definition.executeTool(
    "update_audit_context",
    JSON.stringify({ updates: COMPLETE_UPDATES.slice(0, 3) }),
    initial,
    PREPARATION_CONTEXT,
  );

  assert.equal(updated.state.focus, "Customer onboarding");
  assert.equal(updated.state.currentProcess, "A form is copied into a shared inbox.");
  assert.equal(updated.state.friction, "Follow-up depends on someone noticing the email.");
  assert.deepEqual(updated.output.missingRequiredFields, ["desiredOutcome", "name", "email"]);
  assert.deepEqual(
    definition.getTools(updated.state).map(({ name }) => name),
    ["update_audit_context"],
  );
  assert.match(definition.getInstructions(updated.state), /desiredOutcome, name, email/);
});

test("preparation requires complete data and submission requires a later interaction", async () => {
  const audit = createAuditService();

  const definition = new AuditWorkflowDefinition(audit.service, auditWorkflowProgress);

  const initial = definition.createInitialState({
    originChannel: "web",
    originPage: "/",
    originEntry: "home-audit-cta",
  });

  const incomplete = await definition.executeTool(
    "prepare_audit_submission",
    "{}",
    initial,
    PREPARATION_CONTEXT,
  );

  assert.equal(incomplete.output.error, "incomplete_audit");
  assert.equal(audit.createdCount, 0);

  const updated = await definition.executeTool(
    "update_audit_context",
    JSON.stringify({ updates: COMPLETE_UPDATES }),
    initial,
    PREPARATION_CONTEXT,
  );

  assert.deepEqual(
    definition.getTools(updated.state).map(({ name }) => name),
    ["update_audit_context", "prepare_audit_submission"],
  );

  const prepared = await definition.executeTool(
    "prepare_audit_submission",
    "{}",
    updated.state,
    PREPARATION_CONTEXT,
  );

  assert.equal(prepared.output.kind, "audit_preparation");

  const sameInteraction = await definition.executeTool(
    "submit_audit",
    "{}",
    prepared.state,
    PREPARATION_CONTEXT,
  );

  assert.equal(sameInteraction.output.error, "confirmation_requires_new_input");
  assert.equal(audit.createdCount, 0);

  const structuredAnswer = await definition.executeTool(
    "submit_audit",
    "{}",
    prepared.state,
    { ...CONFIRMATION_CONTEXT, allowConfirmation: false },
  );

  assert.equal(structuredAnswer.output.error, "separate_confirmation_required");
  assert.equal(structuredAnswer.status, "active");
  assert.equal(audit.createdCount, 0);

  const submitted = await definition.executeTool(
    "submit_audit",
    "{}",
    prepared.state,
    CONFIRMATION_CONTEXT,
  );

  assert.equal(submitted.status, "completed");
  assert.equal(submitted.output.kind, "audit_submitted");
  assert.equal(audit.createdCount, 1);
});

test("changing a prepared detail invalidates its confirmation", async () => {
  const audit = createAuditService();

  const definition = new AuditWorkflowDefinition(audit.service, auditWorkflowProgress);

  const initial = definition.createInitialState({
    originChannel: "web",
    originPage: "/",
    originEntry: "home-audit-cta",
  });

  const updated = await definition.executeTool(
    "update_audit_context",
    JSON.stringify({ updates: COMPLETE_UPDATES }),
    initial,
    PREPARATION_CONTEXT,
  );

  const prepared = await definition.executeTool(
    "prepare_audit_submission",
    "{}",
    updated.state,
    PREPARATION_CONTEXT,
  );

  const corrected = await definition.executeTool(
    "update_audit_context",
    JSON.stringify({ updates: [{ field: "friction", value: "Customers wait two days." }] }),
    prepared.state,
    CONFIRMATION_CONTEXT,
  );

  assert.equal(corrected.state.preparedInteractionId, null);
  assert.equal(corrected.state.friction, "Customers wait two days.");
  assert.deepEqual(
    definition.getTools(corrected.state).map(({ name }) => name),
    ["update_audit_context", "prepare_audit_submission"],
  );

  const rejected = await definition.executeTool(
    "submit_audit",
    "{}",
    corrected.state,
    CONFIRMATION_CONTEXT,
  );

  assert.equal(rejected.output.error, "preparation_required");
  assert.equal(audit.createdCount, 0);
});

test("retry after the request is created but workflow save fails returns one request", async () => {
  const audit = createAuditService();

  const repository = new MemoryWorkflowRepository();

  const workflow = new WorkflowService(
    new WorkflowDefinitionRegistry([
      new AuditWorkflowDefinition(audit.service, auditWorkflowProgress),
    ]),
    repository,
    ["search_website"],
  );

  const instance = await workflow.start("audit", {
    originChannel: "web",
    originPage: "/",
    originEntry: "home-audit-cta",
  });

  await workflow.executeTool(instance.id, {
    name: "update_audit_context",
    rawArguments: JSON.stringify({ updates: COMPLETE_UPDATES }),
    interactionId: PREPARATION_CONTEXT.interactionId,
  });

  await workflow.executeTool(instance.id, {
    name: "prepare_audit_submission",
    rawArguments: "{}",
    interactionId: PREPARATION_CONTEXT.interactionId,
  });

  repository.failNextSave = true;

  await assert.rejects(
    workflow.executeTool(instance.id, {
      name: "submit_audit",
      rawArguments: "{}",
      interactionId: CONFIRMATION_CONTEXT.interactionId,
    }),
    { code: "persistence_failed" },
  );

  const retried = await workflow.executeTool(instance.id, {
    name: "submit_audit",
    rawArguments: "{}",
    interactionId: CONFIRMATION_CONTEXT.interactionId,
  });

  assert.equal(retried.instance.status, "completed");
  assert.equal(audit.submitCalls, 2);
  assert.equal(audit.createdCount, 1);
});

test("cancellation creates no audit request", async () => {
  const audit = createAuditService();

  const workflow = new WorkflowService(
    new WorkflowDefinitionRegistry([
      new AuditWorkflowDefinition(audit.service, auditWorkflowProgress),
    ]),
    new MemoryWorkflowRepository(),
    [],
  );

  const instance = await workflow.start("audit", {
    originChannel: "web",
    originPage: "/",
    originEntry: "home-audit-cta",
  });

  const cancelled = await workflow.cancel(instance.id);

  assert.equal(cancelled.status, "cancelled");
  assert.equal(audit.createdCount, 0);
});

class MemoryWorkflowRepository implements IWorkflowInstanceRepository {
  private readonly instances = new Map<string, WorkflowInstance>();

  failNextSave = false;

  async create(input: CreateWorkflowInstanceInput): Promise<WorkflowInstance> {
    const timestamp = new Date("2026-08-20T10:00:00.000Z");

    const instance: WorkflowInstance = {
      pendingInteraction: null,
      revision: 0,
      id: INSTANCE_ID,
      ...input,
      status: "active",
      startedAt: timestamp,
      completedAt: null,
      updatedAt: timestamp,
    };

    this.instances.set(instance.id, instance);

    return instance;
  }

  async findById(id: string): Promise<WorkflowInstance | null> {
    return this.instances.get(id) ?? null;
  }

  async save(input: SaveWorkflowInstanceInput): Promise<WorkflowInstance> {
    if (this.failNextSave) {
      this.failNextSave = false;
      throw new Error("database unavailable");
    }

    const current = this.instances.get(input.id);

    if (!current || current.status !== "active") {
      throw new Error("workflow unavailable");
    }

    const saved = {
      ...current,
      ...input,
      updatedAt: new Date("2026-08-20T10:01:00.000Z"),
    } satisfies WorkflowInstance;

    this.instances.set(saved.id, saved);

    return saved;
  }
}
