import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createPrismaClient } from "@/infrastructure/database/prisma";
import { CHAT_VISITOR_COOKIE } from "@/app/api/chat/constants";
import { activeWorkflowSchema } from "@/contracts/assistant.contract";

const emptyUrl = process.env.WORKFLOW_EMPTY_URL;

const servicesUrl = process.env.WORKFLOW_SERVICES_URL;

const dbUrl = process.env.WORKFLOW_TEST_DATABASE_URL;

const runnerSecret = "disposable-m28-workflow-runner-test";

test(
  "the assistant runs without Meeting and a second plugin recovers on the same runtime",
  {
    skip:
      !(emptyUrl && servicesUrl && dbUrl) &&
      "Build the disposable empty and services variants first.",
    timeout: 70_000,
  },
  async (t) => {
    assert.ok(emptyUrl && servicesUrl && dbUrl);
    assert.equal(new URL(dbUrl).hostname, "127.0.0.1");
    const browserConfig = "./browser.config.mjs";

    const { browserExecutables, playwrightModule } = await import(browserConfig);

    const { chromium } = await import(playwrightModule);

    const browser = await chromium.launch({ executablePath: browserExecutables.chromium });

    t.after(() => browser.close());
    const db = createPrismaClient(dbUrl);

    t.after(() => db.$disconnect());

    await t.test(
      "a removed Meeting plugin cannot block chat, choices, or portfolio search",
      async () => {
        const context = await browser.newContext({ reducedMotion: "reduce" });

        const page = await context.newPage();

        await page.goto(emptyUrl);
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

        const old = await db.workflowInstance.create({
          data: {
            workflowId: "meeting-booking",
            workflowVersion: 1,
            visitorKey,
            originChannel: "test",
            state: { reason: "Old draft" },
          },
        });

        const review = await db.workflowReview.create({
          data: {
            instanceId: old.id,
            revision: 0,
            version: 1,
            actionKey: "book-meeting",
            display: {},
            payload: {},
            status: "consumed",
          },
        });

        const run = await db.workflowRun.create({
          data: {
            reviewId: review.id,
            steps: { create: { key: "calendar", position: 0, label: "Calendar" } },
          },
        });

        try {
          await page.getByRole("button", { name: "Open portfolio chat" }).click();
          const dialog = page.getByRole("dialog");

          async function send(text: string) {
            await dialog.getByRole("textbox", { name: "Your message" }).fill(text);
            await dialog.getByRole("button", { name: "Send message" }).click();
          }

          await send("Hello");
          await dialog.getByText("Hello! How can I help?", { exact: true }).waitFor();
          await send("Give me options");
          await dialog.getByRole("button", { name: "Web app", exact: true }).waitFor();
          await send("What did Freeman build for JPScents?");
          await dialog.getByRole("link", { name: /JPScents/ }).waitFor();
          await page.screenshot({ path: "/tmp/m28-empty-restore.png", animations: "disabled" });
          const restore = await context.request.get(new URL("/api/chat", emptyUrl).href);

          assert.equal(await restore.json(), null);
          const kicked = await context.request.post(
            new URL("/api/internal/workflow-runner", emptyUrl).href,
            {
              headers: { authorization: `Bearer ${runnerSecret}` },
            },
          );

          assert.equal(kicked.status(), 200);
          const step = await db.workflowStep.findFirstOrThrow({ where: { runId: run.id } });

          assert.equal(step.reason, "definition_unavailable");
        } finally {
          await context.close();
          await db.workflowStep.deleteMany({ where: { runId: run.id } });
          await db.workflowRun.delete({ where: { id: run.id } });
          await db.workflowReview.delete({ where: { id: review.id } });
          await db.workflowInstance.delete({ where: { id: old.id } });
        }
      },
    );

    await t.test(
      "Request Services uses the same browser approval and resumes after a lost acknowledgement",
      async () => {
        const context = await browser.newContext({ reducedMotion: "reduce" });

        try {
          const page = await context.newPage();

          await page.goto(servicesUrl);
          await page.getByRole("button", { name: "Open portfolio chat" }).click();
          const dialog = page.getByRole("dialog");

          async function send(text: string) {
            await dialog.getByRole("textbox", { name: "Your message" }).fill(text);
            await dialog.getByRole("button", { name: "Send message" }).click();
          }

          await send("Request services");
          await dialog.getByRole("button", { name: /Request services/ }).waitFor();
          await dialog.getByRole("button", { name: "Discard draft" }).click();
          await dialog.getByRole("button", { name: "Confirm discard" }).click();
          await dialog
            .getByRole("button", { name: /Request services/ })
            .waitFor({ state: "hidden" });
          assert.equal(
            await (await context.request.get(new URL("/api/chat", servicesUrl).href)).json(),
            null,
          );

          await send("Request services");
          await dialog.getByRole("button", { name: /Request services/ }).waitFor();
          await send("Brief: Build a storefront");
          const review = dialog.getByRole("region", { name: "Review request" });

          await review.getByText("Build a storefront", { exact: true }).waitFor();
          let approvalStatus: number | undefined;

          await page.route(
            "**/api/workflow/approve",
            async (route: { fetch(): Promise<{ status(): number }>; abort(): Promise<void> }) => {
              const response = await route.fetch();

              approvalStatus = response.status();
              await route.abort();
            },
          );

          await review.getByRole("button", { name: "Submit brief" }).click();
          const reply = dialog.getByRole("article").getByText("Brief received.", { exact: true });

          await reply.waitFor();
          assert.equal(await reply.count(), 1);
          assert.equal(
            await dialog.getByRole("article").getByText("Submit brief", { exact: true }).count(),
            1,
          );
          assert.equal(approvalStatus, 200);
          assert.equal(await review.count(), 0);
          await page.reload();
          await page.getByRole("button", { name: "Open portfolio chat" }).click();
          await dialog.getByRole("heading", { name: "What would you like to know?" }).waitFor();
          const restored = await context.request.get(new URL("/api/chat", servicesUrl).href);

          const instance = activeWorkflowSchema.parse(await restored.json());

          assert.equal(instance.run?.status, "finished");
          assert.equal(instance.run?.outcome, "success");
          const row = await db.workflowStep.findFirstOrThrow({
            where: { run: { review: { instanceId: instance.id } } },
          });

          assert.deepEqual(row.outcome, { receipt: row.id, accepted: 1 });
          assert.equal(row.attempts, 1);
          assert.equal(row.probes, 1);
          await page.screenshot({ path: "/tmp/m28-services-restore.png", animations: "disabled" });
        } finally {
          await context.close();
        }
      },
    );
  },
);
