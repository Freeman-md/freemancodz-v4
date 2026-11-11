import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import test from "node:test";
import { NextRequest } from "next/server";
import { CHAT_VISITOR_COOKIE } from "@/app/api/chat/constants";
import { createWorkflowDiscardPost } from "@/app/api/workflow/discard/post";
import type { WorkflowObservation } from "@/contracts/assistant.contract";
import { createPrismaClient } from "@/infrastructure/database/prisma";
import { MeetingBookingWorkflowDefinition } from "@/modules/workflow/definitions/meeting-booking/definition";
import { WorkflowRegistry } from "@/modules/workflow/registry";
import { WorkflowRepository } from "@/modules/workflow/repository";
import { WorkflowService } from "@/modules/workflow/service";
import { RequestServicesDefinition } from "../../e2e/fixtures/request-services";

const databaseUrl = process.env.WORKFLOW_TEST_DATABASE_URL;

test(
  "confirmed draft discard is owned, revision-bound and independent of the definition",
  {
    skip:
      !databaseUrl &&
      "Set WORKFLOW_TEST_DATABASE_URL to a disposable migrated PostgreSQL database.",
  },
  async (t) => {
    assert.ok(databaseUrl);
    assert.ok(["127.0.0.1", "localhost"].includes(new URL(databaseUrl).hostname));

    const db = createPrismaClient(databaseUrl);

    const meeting = new MeetingBookingWorkflowDefinition({
      findAvailableSlots: async () => [],
      isSlotAvailable: async () => false,
    });

    const services = new RequestServicesDefinition();

    const repository = new WorkflowRepository(db);

    const workflow = new WorkflowService(new WorkflowRegistry([meeting, services]), repository);

    const post = createWorkflowDiscardPost(workflow, { info() {}, error() {} });

    const token = randomBytes(32).toString("hex");

    const visitorKey = createHash("sha256").update(token).digest("hex");

    const signal = new AbortController().signal;

    t.after(async () => {
      try {
        const owned = { instance: { visitorKey } };

        await db.workflowStep.deleteMany({ where: { run: { review: owned } } });
        await db.workflowRun.deleteMany({ where: { review: owned } });
        await db.workflowReview.deleteMany({ where: owned });
        await db.workflowInstance.deleteMany({ where: { visitorKey } });
      } finally {
        await db.$disconnect();
      }
    });

    function discard(
      { id, revision }: WorkflowObservation,
      cookie = token,
      origin = "http://localhost",
    ) {
      return post(
        new NextRequest("http://localhost/api/workflow/discard", {
          method: "POST",
          headers: { origin, cookie: `${CHAT_VISITOR_COOKIE}=${cookie}` },
          body: JSON.stringify({ id, revision }),
        }),
      );
    }

    const booking = await workflow.start({
      workflowId: meeting.id,
      visitorKey,
      originChannel: "test",
      signal,
    });

    const brief = await workflow.start({
      workflowId: services.id,
      visitorKey,
      originChannel: "test",
      signal,
    });

    assert.equal((await discard(booking, token, "https://other.example")).status, 403);
    assert.equal((await discard(booking, randomBytes(32).toString("hex"))).status, 409);
    assert.equal((await discard({ ...booking, revision: booking.revision + 1 })).status, 409);
    assert.equal((await discard(booking)).status, 204);
    assert.equal((await workflow.getActive(visitorKey))?.id, brief.id);
    assert.equal(
      (await db.workflowInstance.findUniqueOrThrow({ where: { id: booking.id } })).status,
      "cancelled",
    );
    assert.equal((await discard(booking)).status, 409);

    const turn = await workflow.getTurn(visitorKey, brief);

    const save = turn.tools.find(({ tool }) => tool.name === "save_service_brief");

    assert.ok(save);
    const updated = await save.run('{"brief":"Build a storefront"}', signal);

    const prepared = updated?.instance;

    assert.ok(prepared?.review);
    assert.equal((await discard(prepared)).status, 204);
    assert.equal(await workflow.getActive(visitorKey), null);
    assert.equal(
      (await db.workflowReview.findUniqueOrThrow({ where: { id: prepared.review.id } })).status,
      "invalidated",
    );
    assert.equal(
      (
        await workflow.approve(visitorKey, {
          reviewId: prepared.review.id,
          expectedRevision: prepared.revision,
        })
      ).status,
      "conflict",
    );
    assert.equal(await db.workflowRun.count({ where: { review: { instanceId: brief.id } } }), 0);
    assert.equal(await save.run('{"brief":"Stale update"}', signal), null);

    const fresh = await workflow.start({
      workflowId: services.id,
      visitorKey,
      originChannel: "test",
      signal,
    });

    assert.notEqual(fresh.id, brief.id);
    const freshTurn = await workflow.getTurn(visitorKey, fresh);

    const freshUpdate = await freshTurn.tools[0]?.run('{"brief":"Approved request"}', signal);

    const review = freshUpdate?.instance;

    assert.ok(review?.review);
    const [approved, discarded] = await Promise.all([
      workflow.approve(visitorKey, {
        reviewId: review.review.id,
        expectedRevision: review.revision,
      }),
      discard(review),
    ]);

    assert.equal(Number(approved.status === "accepted") + Number(discarded.status === 204), 1);
    assert.equal(
      await db.workflowRun.count({ where: { review: { instanceId: fresh.id } } }),
      approved.status === "accepted" ? 1 : 0,
    );
    if (approved.status === "accepted") {
      const active = await workflow.getActive(visitorKey);

      assert.ok(active?.run);
      assert.equal((await discard(active)).status, 409);
    }
  },
);
