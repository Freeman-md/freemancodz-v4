import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { WorkflowInstanceRepository } from "@/modules/workflow/repository";
import { WorkflowService } from "@/modules/workflow/service";
import { WorkflowDefinitionRegistry } from "@/modules/workflow/registry";
import { ContactWorkflowDefinition } from "@/modules/workflow/definitions/contact/contact.definition";
import { ContactWorkflowProgressProjector } from "@/modules/workflow/definitions/contact/contact.progress";
import type { AssistantPresentation } from "@/contracts/assistant-ui.contract";

const adminConnectionUrl = process.env.PORTFOLIO_TEST_DATABASE_URL;

test(
  "disposable PostgreSQL consumes concurrent answers once and rolls back workflow replacement",
  { skip: !adminConnectionUrl, timeout: 180_000 },
  async () => {
    const databaseName = `assistant_inputs_test_${randomUUID().replaceAll("-", "")}`;

    const databaseUrl = new URL(adminConnectionUrl!);

    databaseUrl.pathname = `/${databaseName}`;
    const admin = new Client({ connectionString: adminConnectionUrl });

    let database: Client | undefined;

    let prisma: PrismaClient | undefined;

    await admin.connect();
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    try {
      database = new Client({ connectionString: databaseUrl.toString() });
      await database.connect();
      // Only these two migrations own this independent table; no vector/provider setup is needed.
      await database.query(
        await readFile(
          resolve("prisma/migrations/20260820120000_add_workflow_instances/migration.sql"),
          "utf8",
        ),
      );
      await database.query(
        "INSERT INTO workflow_instances (workflow_id, workflow_version, state, origin_channel) VALUES ('legacy', 1, '{}', 'web')",
      );
      await database.query(
        await readFile(
          resolve("prisma/migrations/20261002090000_add_workflow_interactions/migration.sql"),
          "utf8",
        ),
      );
      const legacy = await database.query(
        "SELECT revision, pending_interaction FROM workflow_instances WHERE workflow_id = 'legacy'",
      );

      assert.deepEqual(legacy.rows, [{ revision: 0, pending_interaction: null }]);
      const posture = await database.query(
        `SELECT relrowsecurity, has_table_privilege('anon', 'workflow_instances', 'SELECT,INSERT,UPDATE,DELETE') AS anon_access, has_table_privilege('authenticated', 'workflow_instances', 'SELECT,INSERT,UPDATE,DELETE') AS authenticated_access FROM pg_class WHERE oid = 'workflow_instances'::regclass`,
      );

      assert.deepEqual(posture.rows[0], {
        relrowsecurity: true,
        anon_access: false,
        authenticated_access: false,
      });
      prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: databaseUrl.toString() }),
      });
      const repository = new WorkflowInstanceRepository(prisma);

      const contact = new ContactWorkflowDefinition(
        {
          submit: async () => {
            throw new Error("Forms must not send");
          },
        },
        new ContactWorkflowProgressProjector(),
      );

      const other = {
        ...contact,
        id: "other",
        version: 1,
        description: "Other",
        stateSchema: contact.stateSchema,
        createInitialState: contact.createInitialState.bind(contact),
        getInstructions: contact.getInstructions.bind(contact),
        getTools: contact.getTools.bind(contact),
        getProgress: contact.getProgress.bind(contact),
        executeTool: contact.executeTool.bind(contact),
      };

      const service = new WorkflowService(
        new WorkflowDefinitionRegistry([contact, other]),
        repository,
        ["present_ui"],
      );

      const origin = { originChannel: "web", originPage: null, originEntry: null };

      const instance = await service.start("contact", origin);

      const presentation: AssistantPresentation = {
        introduction: "What email should Freeman use?",
        heading: "Details",
        operation: "fields",
        targetWorkflowId: null,
        controls: [
          {
            component: "InputField",
            field: "email",
            label: "Email",
            inputType: "email",
            options: null,
          },
        ],
      };

      const pending = await service.prepareInteraction(instance.id, presentation);

      const answer = {
        interactionId: pending.id,
        revision: pending.revision,
        values: { email: "visitor@example.test" },
      };

      assert.equal(
        (await service.submitInteraction(instance.id, { ...answer, values: { email: "bad" } }))
          .result.status,
        "invalid",
      );
      const results = await Promise.all(
        Array.from({ length: 12 }, () => service.submitInteraction(instance.id, answer)),
      );

      assert.equal(results.filter(({ result }) => result.status === "accepted").length, 1);
      assert.equal(results.filter(({ result }) => result.status === "stale").length, 11);
      assert.equal((await repository.findById(instance.id))?.pendingInteraction, null);
      const next = await service.prepareInteraction(instance.id, presentation);

      assert.equal((await service.submitInteraction(instance.id, answer)).result.status, "stale");
      assert.equal(
        (
          await service.submitInteraction(instance.id, {
            interactionId: next.id,
            revision: next.revision,
            values: { email: "next@example.test", extra: "bad" },
          })
        ).result.status,
        "stale",
      );
      const choice: AssistantPresentation = {
        introduction: "Continue this request, or cancel it and start another?",
        heading: "Continue or switch",
        operation: "workflow_choice",
        targetWorkflowId: "other",
        controls: [
          {
            component: "OptionSelector",
            field: "choice",
            label: "Next step",
            inputType: null,
            options: [
              { value: "continue", label: "Continue" },
              { value: "switch", label: "Switch" },
            ],
          },
        ],
      };

      const switching = await service.prepareInteraction(instance.id, choice);

      const switchAnswer = {
        interactionId: switching.id,
        revision: switching.revision,
        values: { choice: "switch" },
      };

      const switched = await Promise.all(
        Array.from({ length: 8 }, () => service.submitInteraction(instance.id, switchAnswer)),
      );

      assert.equal(switched.filter(({ result }) => result.status === "accepted").length, 1);
      assert.equal(await prisma.workflowInstance.count({ where: { workflowId: "other" } }), 1);
      const rollback = await repository.create({
        ...origin,
        workflowId: "contact",
        workflowVersion: 1,
        state: contact.createInitialState(origin),
      });

      await assert.rejects(
        repository.save({
          id: rollback.id,
          expectedRevision: rollback.revision,
          status: "cancelled",
          state: {},
          completedAt: null,
          replacement: { ...origin, workflowId: "", workflowVersion: 1, state: {} },
        }),
      );
      assert.deepEqual(await repository.findById(rollback.id), rollback);
    } finally {
      await prisma?.$disconnect();
      await database?.end();
      await admin.query(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1",
        [databaseName],
      );
      await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await admin.end();
    }
  },
);
