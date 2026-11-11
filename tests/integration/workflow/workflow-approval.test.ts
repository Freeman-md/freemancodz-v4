import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import test from "node:test";
import { NextRequest } from "next/server";
import { createWorkflowRunnerPost } from "@/app/api/internal/workflow-runner/post";
import { CHAT_VISITOR_COOKIE } from "@/app/api/chat/constants";
import { createWorkflowApprovalPost } from "@/app/api/workflow/approve/post";
import {
  activeWorkflowSchema,
  assistantStreamEventSchema,
  type AssistantActivity,
} from "@/contracts/assistant.contract";
import { createPrismaClient } from "@/infrastructure/database/prisma";
import {
  CalendarEventError,
  type CalendarClient,
  type CreatedCalendarEvent,
} from "@/infrastructure/google-calendar/types";
import { ResendClientError, type ResendEmailInput } from "@/infrastructure/resend/client";
import { MeetingRepository } from "@/modules/meeting/repository";
import type { MeetingSlot } from "@/modules/meeting/types";
import { MeetingOwnerNotice } from "@/modules/meeting/owner-notice";
import { createMeetingBookingAction } from "@/modules/workflow/definitions/meeting-booking/actions";
import { MeetingBookingWorkflowDefinition } from "@/modules/workflow/definitions/meeting-booking/definition";
import { WorkflowRegistry } from "@/modules/workflow/registry";
import { WorkflowRepository } from "@/modules/workflow/repository";
import { WorkflowRunRepository } from "@/modules/workflow/run-repository";
import { WorkflowRunner } from "@/modules/workflow/runner";
import { WorkflowService } from "@/modules/workflow/service";

const databaseUrl = process.env.WORKFLOW_TEST_DATABASE_URL;

const logger = { info() {}, error() {} };

const session = randomBytes(32).toString("hex");

const visitorKey = createHash("sha256").update(session).digest("hex");

const slot: MeetingSlot = {
  start: "2098-06-15T11:00:00.000Z",
  end: "2098-06-15T11:30:00.000Z",
  timezone: "Europe/London",
};

const secondSlot: MeetingSlot = {
  ...slot,
  start: "2098-06-16T11:00:00.000Z",
  end: "2098-06-16T11:30:00.000Z",
};

const thirdSlot: MeetingSlot = {
  ...slot,
  start: "2098-06-17T11:00:00.000Z",
  end: "2098-06-17T11:30:00.000Z",
};

const fourthSlot: MeetingSlot = {
  ...slot,
  start: "2098-06-18T11:00:00.000Z",
  end: "2098-06-18T11:30:00.000Z",
};

const failureSlot: MeetingSlot = {
  ...slot,
  start: "2098-06-19T11:00:00.000Z",
  end: "2098-06-19T11:30:00.000Z",
};

function approvalRequest(body: object, origin = "http://localhost", token = session) {
  return new NextRequest("http://localhost/api/workflow/approve", {
    method: "POST",
    headers: {
      origin,
      "Content-Type": "application/json",
      Cookie: `${CHAT_VISITOR_COOKIE}=${token}`,
    },
    body: JSON.stringify(body),
  });
}

test(
  "approval freezes the exact review, fences execution and reconciles lost effects",
  {
    skip:
      !databaseUrl &&
      "Set WORKFLOW_TEST_DATABASE_URL to a disposable migrated PostgreSQL database.",
  },
  async (t) => {
    assert.ok(databaseUrl);
    assert.ok(
      ["127.0.0.1", "localhost"].includes(new URL(databaseUrl).hostname),
      "Use disposable local PostgreSQL",
    );
    const prisma = createPrismaClient(databaseUrl);

    const store = new MeetingRepository(prisma);

    const repository = new WorkflowRepository(prisma);

    const runRepository = new WorkflowRunRepository(prisma);

    const bookedEvents = new Map<string, CreatedCalendarEvent>();

    const receipts = new Map<string, ResendEmailInput>();

    const inserted: string[] = [];

    const sent: string[] = [];

    const savedMeetings: string[] = [];

    const visitors = new Set<string>([visitorKey]);

    let now = Date.now() + 60_000;

    let hideEvent = false;

    let mismatch = false;

    let lostCalendar = false;

    let rejectCalendar = false;

    let lostBooking = false;

    let failBooking = false;

    let lostNotice = false;

    let rejectNotice = false;

    let delayBeforeNoticeProbe = 0;

    const clock = () => new Date(now);

    const advance = (ms: number) => {
      now += ms;
    };

    const calendar: CalendarClient = {
      getBusyPeriods: async () => [],
      findEvent: async (id) => (hideEvent ? null : (bookedEvents.get(id) ?? null)),
      createEvent: async (input) => {
        inserted.push(input.eventId);
        if (rejectCalendar) {
          throw new CalendarEventError(undefined, "terminal");
        }

        assert.equal(
          bookedEvents.has(input.eventId),
          false,
          "the Calendar insert must never replay after ambiguity",
        );
        const event = {
          id: input.eventId,
          htmlLink: null,
          payload: {
            id: input.eventId,
            status: "confirmed",
            summary: input.summary,
            description: input.description,
            attendees: [{ email: mismatch ? "wrong@example.test" : input.attendeeEmail }],
            start: { dateTime: input.start.toISOString(), timeZone: input.timezone },
            end: { dateTime: input.end.toISOString(), timeZone: input.timezone },
            extendedProperties: { private: { bookingOperationId: input.bookingOperationId } },
          },
        };

        bookedEvents.set(event.id, event);
        if (lostCalendar) {
          lostCalendar = false;
          throw new CalendarEventError();
        }

        return event;
      },
    };

    const availability = {
      findAvailableSlots: async () => [slot, secondSlot, thirdSlot, fourthSlot, failureSlot],
      isSlotAvailable: async () => true,
    };

    const notices = new MeetingOwnerNotice(
      {
        sendWithReceipt: async (notice) => {
          assert.deepEqual(receipts.get(notice.idempotencyKey) ?? notice, notice);
          sent.push(notice.idempotencyKey);
          if (rejectNotice) {
            throw new ResendClientError("provider", "terminal");
          }

          receipts.set(notice.idempotencyKey, notice);
          if (lostNotice) {
            lostNotice = false;
            throw new ResendClientError("network");
          }

          return "receipt-local";
        },
      },
      () => ({ fromEmail: "sender@example.test", adminEmail: "owner@example.test" }),
    );

    const action = createMeetingBookingAction(
      availability,
      calendar,
      {
        reserve: (record) => store.reserve(record),
        release: (tx, eventId) => store.release(tx, eventId),
        findMeetingByGoogleEventId: (eventId) => store.findMeetingByGoogleEventId(eventId),
        confirm: async (record) => {
          if (failBooking) {
            failBooking = false;
            throw new Error("Before database write");
          }

          const result = await store.confirm(record);

          savedMeetings.push(record.googleEventId);
          if (lostBooking) {
            lostBooking = false;
            throw new Error("Database acknowledged after disconnect");
          }

          return result;
        },
      },
      notices,
    );

    const definition = new MeetingBookingWorkflowDefinition(availability, {
      ...action,
      steps: action.steps.map((step) =>
        step.key === "owner-notice"
          ? {
              ...step,
              reconcile: (context) => {
                advance(delayBeforeNoticeProbe);

                return step.reconcile(context);
              },
            }
          : step,
      ),
    });

    const registry = new WorkflowRegistry([definition]);

    const workflow = new WorkflowService(registry, repository, clock);

    const runner = (batchSize?: number) =>
      new WorkflowRunner(registry, runRepository, logger, clock, batchSize);

    const approve = createWorkflowApprovalPost(workflow, logger);

    async function ready(key: string, preferred: MeetingSlot) {
      visitors.add(key);
      const instance = await prisma.workflowInstance.create({
        data: {
          visitorKey: key,
          workflowId: definition.id,
          workflowVersion: definition.version,
          originChannel: "test",
          state: {
            name: "Visitor",
            email: "visitor@example.test",
            reason: "Discuss release",
            availableSlots: [],
            selectedSlot: preferred,
          },
        },
      });

      const review = await workflow.getActive(key);

      assert.equal(review?.id, instance.id);
      assert.ok(review.review);

      return { instance, reviewId: review.review.id, expectedRevision: review.revision };
    }

    async function enqueue(preferred: MeetingSlot) {
      const key = randomBytes(32).toString("hex");

      const readyReview = await ready(key, preferred);

      assert.equal(
        (
          await workflow.approve(key, {
            reviewId: readyReview.reviewId,
            expectedRevision: readyReview.expectedRevision,
          })
        ).status,
        "accepted",
      );

      return { key, ...readyReview };
    }

    try {
      await t.test(
        "same-origin owner approval accepts exactly once and freezes inputs",
        async () => {
          const { instance, reviewId, expectedRevision } = await ready(visitorKey, slot);

          const body = { reviewId, expectedRevision };

          assert.equal((await workflow.getActive(visitorKey))?.review?.id, reviewId);
          assert.equal(await workflow.getApprovedResult(visitorKey, reviewId), null);
          assert.equal(
            (await approve(approvalRequest(body, "https://foreign.example"))).status,
            403,
          );
          assert.equal(
            (
              await approve(
                approvalRequest(body, "http://localhost", randomBytes(32).toString("hex")),
              )
            ).status,
            404,
          );
          assert.equal((await approve(approvalRequest({ ...body, message: "yes" }))).status, 400);
          assert.equal(
            (await approve(approvalRequest({ ...body, expectedRevision: 1 }))).status,
            409,
          );

          const [first, second] = await Promise.all([
            approve(approvalRequest(body)),
            approve(approvalRequest(body)),
          ]);

          assert.equal(first.status, 202);
          assert.equal(second.status, 202);
          assert.equal(await workflow.getApprovedResult("different-visitor", reviewId), null);
          assert.equal(
            (await workflow.getApprovedResult(visitorKey, reviewId))?.run?.outcome,
            "pending",
          );
          assert.equal(inserted.length, 0);
          const run = await prisma.workflowRun.findUniqueOrThrow({
            where: { reviewId },
            include: { review: true, steps: { orderBy: { position: "asc" } } },
          });

          assert.deepEqual(
            run.steps.map(({ key }) => key),
            ["calendar", "booking", "owner-notice"],
          );
          assert.deepEqual(run.review.payload, {
            name: "Visitor",
            email: "visitor@example.test",
            reason: "Discuss release",
            slot,
          });
          assert.deepEqual(
            (
              await workflow.getTurn(visitorKey, {
                id: instance.id,
                revision: expectedRevision + 1,
              })
            ).tools,
            [],
          );

          await prisma.workflowInstance.update({
            where: { id: instance.id },
            data: {
              state: {
                name: "Changed draft",
                email: "visitor@example.test",
                reason: "Changed",
                selectedSlot: slot,
              },
            },
          });

          lostCalendar = true;
          lostBooking = true;
          lostNotice = true;
          await runner().runDue();
          assert.equal(inserted.length, 1);
          assert.equal(savedMeetings.length, 1);
          assert.equal(sent.length, 0);
          await Promise.all([runner().runDue(), runner().runDue()]);
          assert.equal(inserted.length, 1);
          assert.equal(savedMeetings.length, 1);
          assert.equal(receipts.size, 1);
          assert.equal(sent.length, 2);
          const persisted = await store.findMeetingByGoogleEventId(inserted[0]);

          assert.equal(persisted?.name, "Visitor");
          assert.equal(persisted?.reason, "Discuss release");
          assert.equal(
            (await workflow.getActive(visitorKey))?.run?.businessStatus,
            "Booking confirmed",
          );
          assert.equal((await workflow.getActive(visitorKey))?.run?.status, "finished");
          await runner().runDue();
          assert.equal(sent.length, 2);
        },
      );

      await t.test(
        "a concurrent edit invalidates the reviewed revision or loses to approval",
        async () => {
          const key = randomBytes(32).toString("hex");

          const { instance, reviewId, expectedRevision } = await ready(key, secondSlot);

          const [edited, approved] = await Promise.all([
            repository.saveState({
              id: instance.id,
              visitorKey: key,
              revision: expectedRevision,
              state: {
                name: "Updated",
                email: "visitor@example.test",
                reason: "Updated",
                selectedSlot: secondSlot,
              },
            }),
            workflow.approve(key, { reviewId, expectedRevision }),
          ]);

          assert.equal(Number(Boolean(edited)) + Number(approved.status === "accepted"), 1);
          if (edited) {
            assert.equal(
              (await workflow.approve(key, { reviewId, expectedRevision })).status,
              "conflict",
            );
            assert.notEqual((await workflow.getActive(key))?.review?.id, reviewId);
          }

          await runner().runDue();
        },
      );

      await t.test(
        "only a current claim can persist a step and a competing slot is held",
        async () => {
          const first = await enqueue(thirdSlot);

          const second = await enqueue(thirdSlot);

          const firstClaim = await runRepository.claim(clock());

          assert.equal(firstClaim?.status, "claimed");
          assert.ok(firstClaim?.status === "claimed");
          assert.ok(await runRepository.markEffect(firstClaim.step, clock()));
          assert.ok(
            await runRepository.checkpoint(firstClaim.step, { dispatching: false }, clock()),
          );
          const competing = await runRepository.claim(clock());

          assert.ok(competing?.status === "claimed");
          const { step } = firstClaim;

          advance(46_000);
          const renewed = await runRepository.claim(clock());

          assert.ok(renewed?.status === "claimed");
          assert.equal(renewed.step.id, step.id);
          assert.equal(renewed.reconcile, true);
          assert.equal(await runRepository.settle(step, { status: "attention" }, clock()), false);
          assert.equal(
            await runRepository.settle(renewed.step, { status: "retry", nextAt: clock() }, clock()),
            true,
          );
          await runner().runDue();
          advance(60_000);
          await runner().runDue();
          assert.equal(
            (await workflow.getActive(first.key))?.run?.businessStatus,
            "Booking confirmed",
          );
          assert.equal((await workflow.getActive(second.key))?.run?.status, "attention");
          assert.equal((await workflow.getActive(second.key))?.run?.outcome, "failure");
          assert.equal(
            [...bookedEvents.values()].filter((event) =>
              JSON.stringify(event.payload).includes(thirdSlot.start),
            ).length,
            1,
          );
        },
      );

      await t.test(
        "an inconclusive Calendar lookup respects probe delays and retains the hold",
        async () => {
          const booking = await enqueue(fourthSlot);

          lostCalendar = true;
          hideEvent = true;
          await runner().runDue();
          const run = await prisma.workflowRun.findUniqueOrThrow({
            where: { reviewId: booking.reviewId },
          });

          const step = () =>
            prisma.workflowStep.findUniqueOrThrow({
              where: { runId_key: { runId: run.id, key: "calendar" } },
            });

          const first = await step();

          assert.equal((await workflow.getActive(booking.key))?.run?.outcome, "uncertain");
          assert.equal(first.attempts, 1);
          assert.equal(first.probes, 1);
          assert.equal(first.nextAt.getTime(), now + 60_000);
          await runner().runDue();
          assert.equal((await step()).probes, 1);
          advance(60_000);
          await runner().runDue();
          assert.equal((await step()).nextAt.getTime(), now + 300_000);
          advance(300_000);
          await runner().runDue();
          assert.equal((await step()).status, "attention");
          assert.equal((await step()).probes, 3);
          assert.equal((await workflow.getActive(booking.key))?.run?.status, "attention");
          assert.equal(
            (await store.findMeetingByGoogleEventId(`b${run.id.replaceAll("-", "")}`))?.status,
            "pending",
          );
          hideEvent = false;
        },
      );

      await t.test("lost reconciliation claims preserve both probe backoffs", async () => {
        const booking = await enqueue({
          ...slot,
          start: "2098-06-23T11:00:00.000Z",
          end: "2098-06-23T11:30:00.000Z",
        });

        lostCalendar = true;
        await runner(1).runDue();

        const first = await runRepository.claim(clock());

        assert.ok(first?.status === "claimed" && first.reconcile);
        assert.equal(first.step.probes, 1);

        advance(45_000);
        assert.equal(await runRepository.claim(clock()), null);
        advance(15_000);
        const second = await runRepository.claim(clock());

        assert.ok(second?.status === "claimed" && second.reconcile);
        assert.equal(second.step.probes, 2);
        assert.equal(second.step.id, first.step.id);
        const live = (await workflow.getActive(booking.key))?.run;

        assert.equal(live?.status, "running");
        assert.equal(live?.steps[0].status, "reconciling");

        advance(45_000);
        assert.equal(await runRepository.claim(clock()), null);
        const waiting = (await workflow.getActive(booking.key))?.run;

        assert.equal(waiting?.status, "retry");
        assert.equal(waiting?.outcome, "uncertain");
        assert.equal(waiting?.steps[0].status, "retry");
        advance(255_000);
        await runner().runDue();
        assert.equal((await workflow.getActive(booking.key))?.run?.status, "finished");
      });

      await t.test(
        "a save failure retries independently and owner rejection preserves booking",
        async () => {
          const booking = await enqueue(failureSlot);

          failBooking = true;
          rejectNotice = true;
          const eventsBefore = inserted.length;

          const activities: AssistantActivity[] = [];

          const report = (event: AssistantActivity) => activities.push(event);

          await runner().runDue(booking.reviewId, report);
          assert.ok(
            activities.some(
              ({ label, status }) =>
                label === "Saving booking details" && status === "retry_scheduled",
            ),
          );
          assert.equal((await workflow.getActive(booking.key))?.run?.status, "retry");
          assert.equal((await workflow.getActive(booking.key))?.run?.outcome, "pending");
          advance(60_000);
          await runner().runDue(booking.reviewId, report);
          assert.deepEqual(
            activities
              .filter(({ status }) => status === "started" || status === "retrying")
              .map(({ label }) => label),
            [
              "Creating meeting",
              "Saving booking details",
              "Saving booking details",
              "Sending notification",
            ],
          );
          assert.equal(activities.at(-1)?.status, "failed");
          const visible = await workflow.getActive(booking.key);

          assert.equal(visible?.run?.businessStatus, "Booking confirmed");
          assert.equal(visible?.run?.status, "attention");
          assert.equal(visible?.run?.outcome, "failure");
          assert.equal(inserted.length, eventsBefore + 1);
          rejectNotice = false;
        },
      );

      await t.test(
        "an uncertain owner send is never replayed after its idempotency window",
        async () => {
          const booking = await enqueue({
            ...slot,
            start: "2098-06-21T11:00:00.000Z",
            end: "2098-06-21T11:30:00.000Z",
          });

          const callsBefore = sent.length;

          lostNotice = true;
          // Keep the initial send's unresolved claim durable without invoking the probe in the same batch.
          await runner(3).runDue();
          assert.equal(sent.length, callsBefore + 1);
          advance(24 * 60 * 60 * 1000 - 1);
          delayBeforeNoticeProbe = 2;
          await runner().runDue();
          delayBeforeNoticeProbe = 0;
          assert.equal(sent.length, callsBefore + 1);
          const visible = await workflow.getActive(booking.key);

          assert.equal(visible?.run?.status, "attention");
          assert.equal(visible?.run?.outcome, "uncertain");
          assert.equal(visible?.run?.businessStatus, "Booking confirmed");
        },
      );

      await t.test("the scheduler rejects unauthorized calls before claiming work", async () => {
        const secret = "disposable-test-secret-32-characters";

        const post = createWorkflowRunnerPost(() => secret, runner(), logger);

        const endpoint = "http://localhost/api/internal/workflow-runner";

        assert.equal((await post(new Request(endpoint, { method: "POST" }))).status, 401);
        assert.equal(
          (
            await post(
              new Request(endpoint, {
                method: "POST",
                headers: {
                  authorization: `Bearer ${secret}`,
                },
              }),
            )
          ).status,
          200,
        );
      });

      await t.test("a returned event with a different attendee stops before booking", async () => {
        mismatch = true;
        const booking = await enqueue({
          ...slot,
          start: "2098-06-22T11:00:00.000Z",
          end: "2098-06-22T11:30:00.000Z",
        });

        const before = savedMeetings.length;

        await runner().runDue();
        assert.equal((await workflow.getActive(booking.key))?.run?.status, "attention");
        assert.equal((await workflow.getActive(booking.key))?.run?.outcome, "uncertain");
        assert.equal(savedMeetings.length, before);
        mismatch = false;
      });

      await t.test(
        "approval reports a definite Calendar rejection and handles legacy outcomes",
        async () => {
          const token = randomBytes(32).toString("hex");

          const key = createHash("sha256").update(token).digest("hex");

          const { reviewId, expectedRevision } = await ready(key, {
            ...slot,
            start: "2098-06-24T11:00:00.000Z",
            end: "2098-06-24T11:30:00.000Z",
          });

          const confirm = createWorkflowApprovalPost(workflow, logger, (id) => runner().runDue(id));

          rejectCalendar = true;
          const response = await confirm(
            approvalRequest({ reviewId, expectedRevision }, undefined, token),
          );

          rejectCalendar = false;

          assert.equal(response.status, 200);
          const result = activeWorkflowSchema.parse(await response.json());

          assert.equal(result.run?.outcome, "failure");
          assert.equal(result.run?.businessStatus, undefined);

          await prisma.workflowStep.updateMany({
            where: { run: { reviewId }, key: "calendar" },
            data: { outcome: {} },
          });
          assert.equal((await workflow.getActive(key))?.run?.outcome, "uncertain");
        },
      );

      await t.test(
        "the worker resumes the original event after the approval process stops",
        async () => {
          const token = randomBytes(32).toString("hex");

          const key = createHash("sha256").update(token).digest("hex");

          const { instance, reviewId, expectedRevision } = await ready(key, {
            ...slot,
            start: "2098-06-25T11:00:00.000Z",
            end: "2098-06-25T11:30:00.000Z",
          });

          const interrupted = new WorkflowRunRepository(prisma);

          const release = Promise.withResolvers<void>();

          const stopped = Promise.withResolvers<void>();

          t.mock.method(interrupted, "settle", async () => {
            await release.promise;
            throw new Error("Execution stopped after writing to Calendar");
          });
          const firstAttempt = new WorkflowRunner(registry, interrupted, logger, clock);

          const confirm = createWorkflowApprovalPost(workflow, logger, async (id, onActivity) => {
            try {
              return await firstAttempt.runDue(id, onActivity);
            } finally {
              stopped.resolve();
            }
          });

          const before = inserted.length;

          const request = approvalRequest({ reviewId, expectedRevision }, undefined, token);

          request.headers.set("accept", "application/x-ndjson");

          const response = await confirm(request);

          assert.equal(response.status, 200);
          assert.ok(response.body);
          const reader = response.body.getReader();

          try {
            const first = await reader.read();

            assert.deepEqual(
              assistantStreamEventSchema.parse(JSON.parse(new TextDecoder().decode(first.value))),
              {
                type: "activity",
                label: "Creating meeting",
                status: "started",
              },
            );
            const cancellation = reader.cancel();

            release.resolve();
            await cancellation;
          } finally {
            release.resolve();
          }

          await stopped.promise;
          assert.equal((await workflow.getActive(key))?.run?.outcome, "pending");
          const original = await prisma.workflowRun.findUniqueOrThrow({ where: { reviewId } });

          const eventId = inserted.at(-1);

          assert.ok(eventId && bookedEvents.has(eventId));
          advance(46_000);
          assert.equal((await workflow.getActive(key))?.run?.outcome, "uncertain");

          const secret = "disposable-test-secret-32-characters";

          const worker = createWorkflowRunnerPost(() => secret, runner(), logger);

          const recovery = await worker(
            new Request("http://localhost/api/internal/workflow-runner", {
              method: "POST",
              headers: { authorization: `Bearer ${secret}` },
            }),
          );

          assert.equal(recovery.status, 200);
          const restored = await workflow.getActive(key);

          assert.equal(restored?.id, instance.id);
          assert.equal(restored?.run?.outcome, "success");
          assert.equal(restored?.run?.businessStatus, "Booking confirmed");
          assert.equal(
            (await prisma.workflowRun.findUniqueOrThrow({ where: { reviewId } })).id,
            original.id,
          );
          assert.equal(inserted.length, before + 1);
          assert.equal((await store.findMeetingByGoogleEventId(eventId))?.status, "confirmed");
        },
      );

      await t.test(
        "duplicate approvals execute only their review with the scheduler off",
        async () => {
          const unrelated = await enqueue({
            ...slot,
            start: "2098-06-26T11:00:00.000Z",
            end: "2098-06-26T11:30:00.000Z",
          });

          const token = randomBytes(32).toString("hex");

          const key = createHash("sha256").update(token).digest("hex");

          const { instance, reviewId, expectedRevision } = await ready(key, {
            ...slot,
            start: "2098-06-27T11:00:00.000Z",
            end: "2098-06-27T11:30:00.000Z",
          });

          const confirm = createWorkflowApprovalPost(workflow, logger, (id) => runner().runDue(id));

          const submit = () =>
            confirm(approvalRequest({ reviewId, expectedRevision }, undefined, token));

          const before = inserted.length;

          const responses = await Promise.all([submit(), submit()]);

          assert.ok(responses.every((response) => response.ok));
          assert.ok(responses.some((response) => response.status === 200));
          assert.equal((await workflow.getActive(key))?.run?.outcome, "success");
          assert.equal(await prisma.workflowRun.count({ where: { reviewId } }), 1);
          assert.equal(inserted.length, before + 1);
          assert.equal((await workflow.getActive(unrelated.key))?.run?.status, "queued");

          await ready(key, secondSlot);
          const replay = await submit();

          assert.equal(replay.status, 200);
          const saved = activeWorkflowSchema.parse(await replay.json());

          assert.equal(saved.id, instance.id);
          assert.equal(saved.run?.businessStatus, "Booking confirmed");
          assert.equal(inserted.length, before + 1);
        },
      );
    } finally {
      const instances = await prisma.workflowInstance.findMany({
        where: { visitorKey: { in: [...visitors] } },
        select: { id: true },
      });

      const ids = instances.map(({ id }) => id);

      const runs = await prisma.workflowRun.findMany({
        where: { review: { instanceId: { in: ids } } },
        select: { id: true },
      });

      await prisma.workflowStep.deleteMany({ where: { runId: { in: runs.map(({ id }) => id) } } });
      await prisma.workflowRun.deleteMany({ where: { id: { in: runs.map(({ id }) => id) } } });
      await prisma.workflowReview.deleteMany({ where: { instanceId: { in: ids } } });
      await prisma.workflowInstance.deleteMany({ where: { id: { in: ids } } });
      await prisma.meeting.deleteMany({
        where: { googleEventId: { in: runs.map(({ id }) => `b${id.replaceAll("-", "")}`) } },
      });
      await prisma.$disconnect();
    }
  },
);
