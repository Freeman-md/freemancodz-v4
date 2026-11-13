import { assertDisposableApp } from "../integration/disposable-target";
import { assertDisposableTarget } from "../integration/disposable-target";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import { createPrismaClient } from "@/infrastructure/database/prisma";
import { CHAT_VISITOR_COOKIE } from "@/app/api/chat/constants";
import { activeWorkflowSchema } from "@/contracts/assistant.contract";

const workflowUrl = process.env.WORKFLOW_E2E_URL;

const databaseUrl = process.env.WORKFLOW_TEST_DATABASE_URL;

test(
  "notice recovery remains available after reopen without reviving an old activity indicator",
  {
    skip:
      !(workflowUrl && databaseUrl) &&
      "Use the local controlled Meeting app and disposable database.",
    timeout: 30_000,
  },
  async (t) => {
    assert.ok(workflowUrl && databaseUrl);
    await assertDisposableTarget(databaseUrl);
    await assertDisposableApp(workflowUrl);
    assert.equal(new URL(databaseUrl).hostname, "127.0.0.1");
    const db = createPrismaClient(databaseUrl);

    t.after(() => db.$disconnect());

    const browserConfig = "./browser.config.mjs";

    const { browserExecutables, playwrightModule } = await import(browserConfig);

    const { chromium } = await import(playwrightModule);

    const browser = await chromium.launch({ executablePath: browserExecutables.chromium });

    t.after(() => browser.close());

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });

    const page = await context.newPage();

    await page.goto(workflowUrl);
    const established = await page.evaluate(
      async () =>
        (
          await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Hello" }),
          })
        ).status,
    );

    assert.equal(established, 428);
    const session = (await context.cookies()).find(
      ({ name }: { name: string }) => name === CHAT_VISITOR_COOKIE,
    );

    assert.ok(session);
    const visitorKey = createHash("sha256").update(session.value).digest("hex");

    const instance = await db.workflowInstance.create({
      data: {
        visitorKey,
        workflowId: "meeting-booking",
        workflowVersion: 1,
        originChannel: "test",
        state: {
          name: "Test visitor",
          email: "visitor@example.test",
          reason: "Notice state",
          selectedSlot: {
            start: "2099-06-15T11:00:00.000Z",
            end: "2099-06-15T11:30:00.000Z",
            timezone: "Europe/London",
          },
        },
      },
    });

    const review = await db.workflowReview.create({
      data: {
        instanceId: instance.id,
        revision: 0,
        version: 1,
        actionKey: "book-meeting",
        status: "consumed",
        display: {},
        payload: {},
      },
    });

    const run = await db.workflowRun.create({
      data: {
        reviewId: review.id,
        status: "running",
        steps: {
          create: [
            { key: "calendar", position: 0, label: "Create Calendar event", status: "succeeded" },
            { key: "booking", position: 1, label: "Save booking", status: "succeeded" },
            {
              key: "owner-notice",
              position: 2,
              label: "Notify owner",
              status: "reconciling",
              claimToken: randomUUID(),
              claimExpires: new Date(Date.now() - 1000),
              nextAt: new Date("2099-06-15T11:00:00.000Z"),
            },
          ],
        },
      },
    });

    try {
      const open = page.getByRole("button", { name: "Open portfolio chat" });

      const dialog = page.getByRole("dialog");

      const chatUrl = new URL("/api/chat", workflowUrl).href;

      await open.click();
      await dialog.getByRole("heading", { name: "What would you like to know?" }).waitFor();
      const pending = activeWorkflowSchema.parse(await (await context.request.get(chatUrl)).json());

      assert.equal(pending.run?.status, "retry");
      assert.equal(pending.run?.businessStatus, "Booking confirmed");
      assert.equal(await dialog.getByRole("status").count(), 0);
      await dialog.getByRole("button", { name: "Close assistant" }).click();
      await dialog.waitFor({ state: "hidden" });

      await db.$transaction([
        db.workflowStep.update({
          where: { runId_key: { runId: run.id, key: "owner-notice" } },
          data: { status: "attention", claimToken: null, claimExpires: null },
        }),
        db.workflowRun.update({ where: { id: run.id }, data: { status: "attention" } }),
      ]);

      await open.click();
      await dialog.getByRole("heading", { name: "What would you like to know?" }).waitFor();
      const restored = activeWorkflowSchema.parse(
        await (await context.request.get(chatUrl)).json(),
      );

      assert.equal(restored.run?.status, "attention");
      assert.equal(restored.run?.businessStatus, "Booking confirmed");
      assert.equal(await dialog.getByRole("status").count(), 0);
      await context.close();
    } finally {
      await db.workflowStep.deleteMany({ where: { runId: run.id } });
      await db.workflowRun.delete({ where: { id: run.id } });
      await db.workflowReview.delete({ where: { id: review.id } });
      await db.workflowInstance.delete({ where: { id: instance.id } });
    }
  },
);
