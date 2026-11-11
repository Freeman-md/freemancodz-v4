import assert from "node:assert/strict";
import test from "node:test";
import { activeWorkflowSchema } from "@/contracts/assistant.contract";

const workflowUrl = process.env.WORKFLOW_E2E_URL;

const browserConfigPath = "./browser.config.mjs";

test(
  "Meeting progress appears after start and restores only in the owning browser session",
  {
    timeout: 140_000,
    skip:
      !workflowUrl &&
      "Set WORKFLOW_E2E_URL for an app with disposable PostgreSQL and a controlled model.",
  },
  async (t) => {
    assert.ok(workflowUrl);
    const { browserExecutables, playwrightModule } = await import(browserConfigPath);

    const { chromium } = await import(playwrightModule);

    const browser = await chromium.launch({ executablePath: browserExecutables.chromium });

    t.after(() => browser.close());

    const chatUrl = new URL("/api/chat", workflowUrl).toString();

    const owner = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });

    const page = await owner.newPage();

    page.setDefaultTimeout(10000);

    await page.goto(workflowUrl, { waitUntil: "load" });
    await page.getByRole("button", { name: "Open portfolio chat" }).click();
    const dialog = page.getByRole("dialog", { name: "Freeman’s assistant" });

    await dialog
      .getByRole("textbox", { name: "Your message" })
      .fill("I want to book a meeting with Freeman.");
    await dialog.getByRole("button", { name: "Send message" }).click();

    const progress = dialog.getByRole("button", { name: /Book a meeting/ });

    await progress.waitFor();
    await progress.getByText("Collecting", { exact: false }).waitFor();
    assert.equal(
      await dialog.getByText("What would you like to discuss?", { exact: true }).count(),
      0,
    );
    await progress.focus();
    await progress.press("Enter");
    await dialog
      .getByRole("listitem")
      .filter({ hasText: "Topic" })
      .getByText("Not provided", { exact: true })
      .waitFor();
    assert.ok(await dialog.getByText("Topic", { exact: true }).isVisible());

    const started = await owner.request.get(chatUrl);

    assert.equal(started.status(), 200);
    const instance = activeWorkflowSchema.parse(await started.json());

    const topic = "I want to discuss a project.";

    await dialog.getByText("Your meeting request is open.", { exact: true }).waitFor();
    await dialog.getByRole("textbox", { name: "Your message" }).fill(topic);
    await dialog.getByRole("button", { name: "Send message" }).click();
    await dialog.getByRole("listitem").getByText(topic, { exact: true }).waitFor();
    await progress.getByText("1 of 4 details", { exact: true }).waitFor();

    await dialog.getByRole("textbox", { name: "Your message" }).fill("Show times on 2099-06-15.");
    await dialog.getByRole("button", { name: "Send message" }).click();
    await dialog.getByText(/^Available: .*12:00 London time/).waitFor();

    await dialog.getByRole("textbox", { name: "Your message" }).fill("I choose 12:00 London time.");
    await dialog.getByRole("button", { name: "Send message" }).click();
    const timeRow = dialog.getByRole("listitem").filter({ hasText: "Time" });

    const selectedTime = timeRow.getByText(/12:00 London time$/);

    await selectedTime.waitFor();
    const timeLabel = await selectedTime.textContent();

    await progress.getByText("2 of 4 details", { exact: true }).waitFor();

    await page.reload({ waitUntil: "load" });
    const [restored] = await Promise.all([
      page.waitForResponse(
        (response: { url(): string; request(): { method(): string } }) =>
          response.url() === chatUrl && response.request().method() === "GET",
      ),
      page.getByRole("button", { name: "Open portfolio chat" }).click(),
    ]);

    assert.equal(restored.status(), 200);
    assert.deepEqual(activeWorkflowSchema.parse(await restored.json()), {
      ...instance,
      revision: instance.revision + 3,
      details: [
        { key: "name", label: "Name", value: null },
        { key: "email", label: "Email", value: null },
        { key: "reason", label: "Topic", value: topic },
        { key: "time", label: "Time", value: timeLabel },
      ],
    });
    await progress.press("Enter");
    await dialog.getByRole("listitem").getByText(topic, { exact: true }).waitFor();
    await selectedTime.waitFor();

    await dialog
      .getByRole("textbox", { name: "Your message" })
      .fill("Test Visitor, visitor@example.test");
    await dialog.getByRole("button", { name: "Send message" }).click();
    const review = dialog.getByRole("region", { name: "Review request" });

    await review.getByText("visitor@example.test", { exact: true }).waitFor();
    await dialog
      .getByRole("textbox", { name: "Your message" })
      .fill("Discuss the corrected scope.");
    await review.getByRole("button", { name: "Request changes" }).click();
    assert.equal(
      await dialog.getByRole("textbox", { name: "Your message" }).inputValue(),
      "Discuss the corrected scope.",
    );
    await dialog.getByRole("button", { name: "Send message" }).click();
    await review.getByText("Discuss the corrected scope.", { exact: true }).waitFor();
    await review.getByRole("button", { name: "Confirm booking" }).focus();
    const [approval] = await Promise.all([
      page.waitForResponse(
        (response: { url(): string; request(): { method(): string } }) =>
          response.url().endsWith("/api/workflow/approve") &&
          response.request().method() === "POST",
      ),
      review.getByRole("button", { name: "Confirm booking" }).press("Enter"),
    ]);

    assert.equal(approval.status(), 202);
    await progress.getByText(/Queued|Running/).waitFor();
    await dialog.getByRole("button", { name: "Close assistant" }).click();
    await dialog.waitFor({ state: "hidden" });

    if (process.env.WORKFLOW_CRON_REHEARSAL === "1") {
      const cutoff = Date.now() + 70_000;

      let saved;

      do {
        const result = await owner.request.get(chatUrl);

        saved = activeWorkflowSchema.parse(await result.json());
        if (saved.run?.status === "finished") {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } while (Date.now() < cutoff);

      assert.equal(saved?.run?.status, "finished");
      await page.getByRole("button", { name: "Open portfolio chat" }).click();
      await dialog.getByText("Booking confirmed", { exact: true }).waitFor();
      assert.equal(await review.count(), 0);
      await page.screenshot({
        path: process.env.WORKFLOW_E2E_SCREENSHOT ?? "/tmp/m28-booking-mobile.png",
      });
    }

    const other = await browser.newContext({ reducedMotion: "reduce" });

    const separatePage = await other.newPage();

    await separatePage.goto(workflowUrl, { waitUntil: "load" });
    await separatePage.getByRole("button", { name: "Open portfolio chat" }).click();
    const separateDialog = separatePage.getByRole("dialog", { name: "Freeman’s assistant" });

    await separateDialog.getByRole("textbox", { name: "Your message" }).fill("Hello");
    await separateDialog.getByRole("button", { name: "Send message" }).click();
    await separateDialog.getByText("Hello! How can I help?", { exact: true }).waitFor();

    const separate = await other.request.get(chatUrl);

    assert.equal(separate.status(), 200);
    assert.equal(await separate.json(), null);
    assert.equal(await separateDialog.getByRole("button", { name: /Book a meeting/ }).count(), 0);
  },
);
