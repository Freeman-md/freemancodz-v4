import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { createPrismaClient } from "@/infrastructure/database/prisma";
import { meetingBooking } from "@/modules/workflow/definitions/meeting-booking/definition";
import { WorkflowRegistry } from "@/modules/workflow/registry";
import { WorkflowRepository } from "@/modules/workflow/repository";
import { WorkflowService } from "@/modules/workflow/service";

const databaseUrl = process.env.WORKFLOW_TEST_DATABASE_URL;

test(
  "concurrent workflow starts reuse the browser's active instance and pin its version",
  {
    skip:
      !databaseUrl &&
      "Set WORKFLOW_TEST_DATABASE_URL for a disposable migrated PostgreSQL database.",
  },
  async () => {
    assert.ok(databaseUrl);
    const prisma = createPrismaClient(databaseUrl);

    const repository = new WorkflowRepository(prisma);

    const service = new WorkflowService(new WorkflowRegistry([meetingBooking]), repository);

    const visitorKey = randomBytes(32).toString("hex");

    const otherVisitorKey = randomBytes(32).toString("hex");

    const input = {
      workflowId: meetingBooking.id,
      visitorKey,
      originChannel: "web",
      signal: new AbortController().signal,
    };

    try {
      const [started, repeated] = await Promise.all([service.start(input), service.start(input)]);

      assert.deepEqual(repeated, started);
      assert.equal(await prisma.workflowInstance.count({ where: { visitorKey } }), 1);

      await prisma.workflowInstance.update({
        where: { id: started.id },
        data: { state: { reason: "Discuss a project" }, revision: 1 },
      });

      const updatedService = new WorkflowService(
        new WorkflowRegistry([
          meetingBooking,
          { ...meetingBooking, version: 2, title: "Meeting booking v2" },
        ]),
        repository,
      );

      const resumed = await updatedService.start(input);

      assert.deepEqual(resumed, {
        ...started,
        nextStep: null,
        details: [{ key: "reason", label: "Topic", value: "Discuss a project" }],
      });
      assert.deepEqual(await updatedService.getActive(visitorKey), resumed);
      assert.equal(await updatedService.getActive(otherVisitorKey), null);

      const persisted = await prisma.workflowInstance.findUniqueOrThrow({
        where: { id: resumed.id },
      });

      assert.deepEqual(persisted.state, { reason: "Discuss a project" });
      assert.equal(persisted.revision, 1);
      assert.equal(persisted.workflowVersion, 1);

      const otherVisitor = await updatedService.start({ ...input, visitorKey: otherVisitorKey });

      assert.notEqual(otherVisitor.id, started.id);
      assert.equal(otherVisitor.title, "Meeting booking v2");

      await prisma.workflowInstance.update({
        where: { id: started.id },
        data: { status: "cancelled" },
      });
      const next = await updatedService.start(input);

      assert.notEqual(next.id, started.id);
      assert.equal(next.title, "Meeting booking v2");
      assert.equal(
        await prisma.workflowInstance.count({ where: { visitorKey, status: "active" } }),
        1,
      );
    } finally {
      try {
        await prisma.workflowInstance.deleteMany({
          where: { visitorKey: { in: [visitorKey, otherVisitorKey] } },
        });
      } finally {
        await prisma.$disconnect();
      }
    }
  },
);
