import assert from "node:assert/strict";
import test from "node:test";
import { MeetingBookingWorkflowDefinition } from "@/modules/workflow/definitions/meeting-booking/definition";
import { WorkflowRegistry } from "@/modules/workflow/registry";
import type { WorkflowRepository } from "@/modules/workflow/repository";
import { WorkflowService } from "@/modules/workflow/service";

test("workflow start saves only validated initial state", async (t) => {
  const meetingBooking = new MeetingBookingWorkflowDefinition({
    findAvailableSlots: async () => [],
    isSlotAvailable: async () => false,
  });

  const instance = {
    id: "11111111-1111-4111-8111-111111111111",
    workflowId: meetingBooking.id,
    workflowVersion: 1,
    revision: 0,
    state: { reason: null },
  };

  const startOrResume = t.mock.fn(
    async (_input: Parameters<WorkflowRepository["startOrResume"]>[0]) => instance,
  );

  const repository = {
    startOrResume,
    findActive: async () => null,
    saveState: async () => null,
    findRun: async () => null,
    ensureReview: async () => null,
    findOwnedReview: async () => null,
    approve: async () => false,
  };

  const service = new WorkflowService(new WorkflowRegistry([meetingBooking]), repository);

  const input = {
    workflowId: meetingBooking.id,
    visitorKey: "visitor-key",
    originChannel: "web",
    signal: new AbortController().signal,
  };

  await t.test("rejects an unknown definition before writing", async () => {
    await assert.rejects(service.start({ ...input, workflowId: "missing" }), {
      message: "The requested workflow is unavailable.",
    });
    assert.equal(startOrResume.mock.callCount(), 0);
  });

  await t.test("rejects invalid initial state before writing", async () => {
    class InvalidMeetingDefinition extends MeetingBookingWorkflowDefinition {
      override createInitialState() {
        return { ...super.createInitialState(), reason: " " };
      }
    }

    const invalidMeeting = new InvalidMeetingDefinition({
      findAvailableSlots: async () => [],
      isSlotAvailable: async () => false,
    });

    const invalidService = new WorkflowService(new WorkflowRegistry([invalidMeeting]), repository);

    await assert.rejects(invalidService.start(input), {
      name: "ZodError",
    });
    assert.equal(startOrResume.mock.callCount(), 0);
  });

  await t.test("honours an aborted request before writing", async () => {
    const controller = new AbortController();

    controller.abort();
    await assert.rejects(service.start({ ...input, signal: controller.signal }), {
      name: "AbortError",
    });
    assert.equal(startOrResume.mock.callCount(), 0);
  });

  await t.test("saves the Meeting definition version and initial state", async () => {
    assert.deepEqual(await service.start(input), {
      id: instance.id,
      revision: 0,
      title: "Book a meeting",
      status: "active",
      phase: "collecting",
      details: [
        { key: "name", label: "Name", value: null },
        { key: "email", label: "Email", value: null },
        { key: "reason", label: "Topic", value: null },
        { key: "time", label: "Time", value: null },
      ],
    });
    assert.equal(startOrResume.mock.callCount(), 1);
    assert.deepEqual(startOrResume.mock.calls[0].arguments, [
      {
        workflowId: "meeting-booking",
        workflowVersion: 1,
        visitorKey: input.visitorKey,
        state: { name: null, email: null, reason: null, availableSlots: [], selectedSlot: null },
        originChannel: "web",
      },
    ]);
  });
});
