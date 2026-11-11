import assert from "node:assert/strict";
import test from "node:test";
import { meetingBooking } from "@/modules/workflow/definitions/meeting-booking/definition";
import { WorkflowRegistry } from "@/modules/workflow/registry";
import type { WorkflowRepository } from "@/modules/workflow/repository";
import { WorkflowService } from "@/modules/workflow/service";

test("workflow start saves only validated initial state", async (t) => {
  const instance = { id: "instance-1", workflowId: "meeting-booking", workflowVersion: 1 };

  const create = t.mock.fn(async (_input: Parameters<WorkflowRepository["create"]>[0]) => instance);

  const service = new WorkflowService(new WorkflowRegistry([meetingBooking]), { create });

  const signal = new AbortController().signal;

  await t.test("rejects an unknown definition before writing", async () => {
    await assert.rejects(service.start("missing", "web", signal), {
      message: "The requested workflow is unavailable.",
    });
    assert.equal(create.mock.callCount(), 0);
  });

  await t.test("rejects invalid initial state before writing", async () => {
    const invalidMeeting = { ...meetingBooking, createInitialState: () => ({ reason: " " }) };

    const invalidService = new WorkflowService(new WorkflowRegistry([invalidMeeting]), { create });

    await assert.rejects(invalidService.start(meetingBooking.id, "web", signal), {
      name: "ZodError",
    });
    assert.equal(create.mock.callCount(), 0);
  });

  await t.test("honours an aborted request before writing", async () => {
    const controller = new AbortController();

    controller.abort();
    await assert.rejects(service.start(meetingBooking.id, "web", controller.signal), {
      name: "AbortError",
    });
    assert.equal(create.mock.callCount(), 0);
  });

  await t.test("saves the Meeting definition version and initial state", async () => {
    assert.deepEqual(await service.start(meetingBooking.id, "web", signal), instance);
    assert.equal(create.mock.callCount(), 1);
    assert.deepEqual(create.mock.calls[0].arguments, [
      {
        workflowId: "meeting-booking",
        workflowVersion: 1,
        state: { reason: null },
        originChannel: "web",
      },
    ]);
  });
});
