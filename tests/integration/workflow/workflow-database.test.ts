import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import type { MeetingSlot } from "@/modules/meeting/types";
import { createPrismaClient } from "@/infrastructure/database/prisma";
import { MeetingBookingWorkflowDefinition } from "@/modules/workflow/definitions/meeting-booking/definition";
import { WorkflowRegistry } from "@/modules/workflow/registry";
import { WorkflowRepository } from "@/modules/workflow/repository";
import { WorkflowService } from "@/modules/workflow/service";

class MeetingBookingVersionTwo extends MeetingBookingWorkflowDefinition {
  override readonly version = 2;

  override readonly title = "Meeting booking v2";
}

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

    const slots: MeetingSlot[] = [
      {
        start: "2099-06-15T11:00:00.000Z",
        end: "2099-06-15T11:30:00.000Z",
        timezone: "Europe/London",
      },
      {
        start: "2099-06-15T11:30:00.000Z",
        end: "2099-06-15T12:00:00.000Z",
        timezone: "Europe/London",
      },
      {
        start: "2099-06-16T11:00:00.000Z",
        end: "2099-06-16T11:30:00.000Z",
        timezone: "Europe/London",
      },
    ];

    const availability = {
      findAvailableSlots: async () => slots,
      isSlotAvailable: async (slot: MeetingSlot) => slot.start !== slots[0].start,
    };

    const meetingBooking = new MeetingBookingWorkflowDefinition(availability);

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

      async function offeredTool(name: string, revision: number) {
        const turn = await service.getTurn(visitorKey, { id: started.id, revision });

        const tool = turn.tools.find(({ tool }) => tool.name === name);

        assert.ok(tool);

        return tool;
      }

      const firstTool = await offeredTool("save_meeting_topic", 0);

      const staleTool = await offeredTool("save_meeting_topic", 0);

      assert.ok(firstTool && staleTool);
      assert.equal(firstTool.tool.name, "save_meeting_topic");

      const saved = await firstTool.run('{"reason":"Discuss a project"}', input.signal);

      assert.deepEqual(saved?.instance, {
        ...started,
        revision: 1,
        details: [
          { key: "name", label: "Name", value: null },
          { key: "email", label: "Email", value: null },
          { key: "reason", label: "Topic", value: "Discuss a project" },
          { key: "time", label: "Time", value: null },
        ],
      });
      assert.equal(await staleTool.run('{"reason":"Another topic"}', input.signal), null);
      const staleTab = await service.getTurn(visitorKey, { id: started.id, revision: 0 });

      assert.deepEqual(staleTab.tools, []);
      assert.equal(staleTab.refreshed?.revision, 1);
      assert.deepEqual(
        (await service.getTurn(otherVisitorKey, { id: started.id, revision: 1 })).tools,
        [],
      );
      const findSlots = await offeredTool("find_meeting_slots", 1);

      assert.equal(findSlots.tool.name, "find_meeting_slots");

      const updatedService = new WorkflowService(
        new WorkflowRegistry([meetingBooking, new MeetingBookingVersionTwo(availability)]),
        repository,
      );

      const resumed = await updatedService.start(input);

      assert.deepEqual(resumed, saved?.instance);
      assert.deepEqual(await updatedService.getActive(visitorKey), resumed);
      assert.equal(await updatedService.getActive(otherVisitorKey), null);

      const persisted = await prisma.workflowInstance.findUniqueOrThrow({
        where: { id: resumed.id },
      });

      assert.deepEqual(persisted.state, {
        name: null,
        email: null,
        reason: "Discuss a project",
        availableSlots: [],
        selectedSlot: null,
      });
      assert.equal(persisted.revision, 1);
      assert.equal(persisted.workflowVersion, 1);

      const offered = await findSlots.run(
        '{"startDate":"2099-06-15","endDate":"2099-06-16"}',
        input.signal,
      );

      assert.equal(offered?.output.status, "available");

      const initialSelection = await offeredTool("select_meeting_slot", 2);

      assert.equal(initialSelection.tool.name, "select_meeting_slot");
      const unoffered = await initialSelection.run(
        '{"start":"2099-06-17T11:00:00.000Z"}',
        input.signal,
      );

      assert.deepEqual(unoffered, { output: { status: "slot_not_offered" } });
      const busy = await initialSelection.run(
        JSON.stringify({ start: slots[0].start }),
        input.signal,
      );

      assert.equal(busy?.output.status, "slot_unavailable");
      assert.equal(busy?.instance?.details.find(({ key }) => key === "time")?.value, null);

      const firstSelection = await offeredTool("select_meeting_slot", 3);

      const staleSelection = await offeredTool("select_meeting_slot", 3);

      const selected = await firstSelection.run(
        JSON.stringify({ start: slots[1].start }),
        input.signal,
      );

      assert.equal(selected?.output.status, "selected");
      assert.equal(
        await staleSelection.run(JSON.stringify({ start: slots[2].start }), input.signal),
        null,
      );
      assert.deepEqual(await service.getActive(visitorKey), selected?.instance);
      const chosen = await prisma.workflowInstance.findUniqueOrThrow({ where: { id: started.id } });

      assert.deepEqual(chosen.state, {
        name: null,
        email: null,
        reason: "Discuss a project",
        availableSlots: [],
        selectedSlot: slots[1],
      });

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
