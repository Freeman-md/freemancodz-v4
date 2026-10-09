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

const adminConnectionUrl = process.env.PORTFOLIO_TEST_DATABASE_URL;

test(
  "cleanup preserves workflow state, revisions and permissions; concurrent updates and replacement remain atomic",
  { skip: !adminConnectionUrl, timeout: 180_000 },
  async () => {
    const databaseName = `workflow_cleanup_test_${randomUUID().replaceAll("-", "")}`;

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
      // Only workflow-table migrations are needed for this isolated database.
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
      await database.query(
        `UPDATE workflow_instances SET revision = 7, state = '{"name":"Visitor"}', pending_interaction = '{"obsolete":true}' WHERE workflow_id = 'legacy'`,
      );
      const before = await database.query(
        "SELECT * FROM workflow_instances WHERE workflow_id = 'legacy'",
      );

      await database.query(
        await readFile(
          resolve(
            "prisma/migrations/20261008120000_remove_workflow_pending_interaction/migration.sql",
          ),
          "utf8",
        ),
      );
      const after = await database.query(
        "SELECT * FROM workflow_instances WHERE workflow_id = 'legacy'",
      );

      const { pending_interaction: removed, ...preserved } = before.rows[0];

      assert.deepEqual(removed, { obsolete: true });
      assert.deepEqual(after.rows[0], preserved);
      const legacy = await database.query(
        "SELECT revision, state FROM workflow_instances WHERE workflow_id = 'legacy'",
      );

      assert.deepEqual(legacy.rows, [{ revision: 7, state: { name: "Visitor" } }]);
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
            throw new Error("No final submission was authorized");
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
        ["ask_user_choice"],
      );

      const origin = { originChannel: "web", originPage: null, originEntry: null };

      const instance = await service.start("contact", origin);

      const saved = await repository.findById(instance.id);

      assert.ok(saved);
      const updates = await Promise.allSettled(
        Array.from({ length: 12 }, () =>
          repository.save({
            id: instance.id,
            expectedRevision: saved.revision,
            state: { ...contact.createInitialState(origin), name: "Visitor" },
            status: "active",
            completedAt: null,
          }),
        ),
      );

      assert.equal(updates.filter((result) => result.status === "fulfilled").length, 1);
      assert.equal(updates.filter((result) => result.status === "rejected").length, 11);
      const updated = await repository.findById(instance.id);

      assert.equal(updated?.revision, saved.revision + 1);
      const continued = await service.executeTool(instance.id, {
        name: "switch_workflow",
        rawArguments: '{"workflowId":"contact"}',
        interactionId: randomUUID(),
        startContext: origin,
      });

      assert.equal(continued.instance.id, instance.id);
      assert.deepEqual(await repository.findById(instance.id), updated);
      const switched = await Promise.allSettled(
        Array.from({ length: 8 }, () =>
          service.executeTool(instance.id, {
            name: "switch_workflow",
            rawArguments: '{"workflowId":"other"}',
            interactionId: randomUUID(),
            startContext: origin,
          }),
        ),
      );

      assert.equal(switched.filter((result) => result.status === "fulfilled").length, 1);
      assert.equal(await prisma.workflowInstance.count({ where: { workflowId: "other" } }), 1);
      assert.equal((await repository.findById(instance.id))?.status, "cancelled");
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
