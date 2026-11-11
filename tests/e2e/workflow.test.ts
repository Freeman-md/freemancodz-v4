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
    const header = await progress.boundingBox();

    const discardBadge = await dialog.getByRole("button", { name: "Discard draft" }).boundingBox();

    assert.ok(header && discardBadge);
    assert.ok(discardBadge.x > header.x + header.width / 2);
    assert.ok(
      discardBadge.y >= header.y &&
        discardBadge.y + discardBadge.height <= header.y + header.height,
    );
    if (process.env.WORKFLOW_DRAFT_SCREENSHOT) {
      await page.screenshot({
        path: process.env.WORKFLOW_DRAFT_SCREENSHOT,
        animations: "disabled",
      });
    }

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

    await dialog.getByRole("textbox", { name: "Your message" }).fill("Show times this week.");
    await dialog.getByRole("button", { name: "Send message" }).click();
    const choices = dialog.getByRole("group", { name: "Suggested replies" });

    await choices.getByRole("button", { name: /15 Jun 2099.*12:00/ }).waitFor();
    assert.equal(await choices.getByRole("button").count(), 3);
    await dialog.getByRole("textbox", { name: "Your message" }).fill("Friday");
    await dialog.getByRole("button", { name: "Send message" }).click();
    await choices.getByRole("button", { name: /19 Jun 2099.*12:30/ }).waitFor();
    assert.equal(await choices.getByRole("button").count(), 2);
    await choices.getByRole("button", { name: /19 Jun 2099.*12:00/ }).click();
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
      revision: instance.revision + 4,
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
    await dialog.getByRole("textbox", { name: "Your message" }).fill("What are my saved details?");
    await dialog.getByRole("button", { name: "Send message" }).click();
    await dialog
      .getByText(/Topic: I want to discuss a project.*Still needed: Name, Email/)
      .waitFor();

    await dialog
      .getByRole("textbox", { name: "Your message" })
      .fill("Test Visitor, visitor@example.test");
    await dialog.getByRole("button", { name: "Send message" }).click();
    const review = dialog.getByRole("region", { name: "Review request" });

    await review.getByText("visitor@example.test", { exact: true }).waitFor();
    const prepared = activeWorkflowSchema.parse(await (await owner.request.get(chatUrl)).json());

    assert.ok(prepared.review);
    await page.reload({ waitUntil: "load" });
    await page.getByRole("button", { name: "Open portfolio chat" }).click();
    await review.getByText("visitor@example.test", { exact: true }).waitFor();
    await dialog.getByRole("textbox", { name: "Your message" }).fill("What are my saved details?");
    await dialog.getByRole("button", { name: "Send message" }).click();
    await dialog.getByText(/Name: Test Visitor.*Use Confirm booking to continue/).waitFor();
    await dialog
      .getByRole("textbox", { name: "Your message" })
      .fill(
        "Change my name to Updated Visitor, email to updated@example.test, and topic to a booking marketplace.",
      );
    await review.getByRole("button", { name: "Request changes" }).click();
    assert.equal((await (await owner.request.get(chatUrl)).json()).review.id, prepared.review.id);
    assert.equal(
      await dialog.getByRole("textbox", { name: "Your message" }).inputValue(),
      "Change my name to Updated Visitor, email to updated@example.test, and topic to a booking marketplace.",
    );
    await dialog.getByRole("button", { name: "Send message" }).click();
    await review.getByText("Discuss the booking marketplace.", { exact: true }).waitFor();
    await review.getByText("Updated Visitor", { exact: true }).waitFor();
    await review.getByText("updated@example.test", { exact: true }).waitFor();
    const staleApproval = await owner.request.post(
      new URL("/api/workflow/approve", workflowUrl).href,
      {
        headers: { origin: new URL(workflowUrl).origin },
        data: { reviewId: prepared.review.id, expectedRevision: prepared.revision },
      },
    );

    assert.equal(staleApproval.status(), 409);
    const corrected = activeWorkflowSchema.parse(await (await owner.request.get(chatUrl)).json());

    assert.ok(corrected.review);
    await dialog
      .getByRole("textbox", { name: "Your message" })
      .fill("Change my email to moved@example.test and move it to Friday at 12:30 London time.");
    await dialog.getByRole("button", { name: "Send message" }).click();
    await review.getByText(/12:30 London time$/).waitFor();
    await review.getByText("moved@example.test", { exact: true }).waitFor();
    const moved = activeWorkflowSchema.parse(await (await owner.request.get(chatUrl)).json());

    assert.equal(moved.run, undefined);
    assert.equal(
      (
        await owner.request.post(new URL("/api/workflow/approve", workflowUrl).href, {
          headers: { origin: new URL(workflowUrl).origin },
          data: { reviewId: corrected.review.id, expectedRevision: corrected.revision },
        })
      ).status(),
      409,
    );
    const reviewBounds = await review.boundingBox();

    const composerBounds = await dialog
      .getByRole("textbox", { name: "Your message" })
      .boundingBox();

    assert.ok(reviewBounds && composerBounds);
    assert.ok(reviewBounds.y > header.y + header.height);
    assert.ok(reviewBounds.y + reviewBounds.height <= composerBounds.y);
    if (process.env.WORKFLOW_REVIEW_SCREENSHOT) {
      await page.screenshot({
        path: process.env.WORKFLOW_REVIEW_SCREENSHOT,
        animations: "disabled",
      });
    }

    await dialog.getByRole("textbox", { name: "Your message" }).fill("Confirm booking");
    await dialog.getByRole("button", { name: "Send message" }).click();
    await dialog.getByText("Hello! How can I help?", { exact: true }).waitFor();
    assert.equal((await (await owner.request.get(chatUrl)).json()).run, undefined);

    await review.getByRole("button", { name: "Confirm booking" }).focus();
    await page.evaluate(() => {
      const observed: string[] = [];

      const observer = new MutationObserver(() => {
        const label = document.querySelector(
          '[role="dialog"] article [role="status"]',
        )?.textContent;

        if (label && observed.at(-1) !== label) {
          observed.push(label);
          document.body.dataset.bookingActivity = JSON.stringify(observed);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    const release = Promise.withResolvers<void>();

    await page.route(
      "**/api/workflow/approve",
      async (route: { continue(): Promise<void> }) => {
        await release.promise;
        await route.continue();
      },
      { times: 1 },
    );

    const approvalResponse = page.waitForResponse(
      (response: { url(): string; request(): { method(): string } }) =>
        response.url().endsWith("/api/workflow/approve") && response.request().method() === "POST",
    );

    const activity = dialog.getByRole("article").getByRole("status");

    try {
      await review.getByRole("button", { name: "Confirm booking" }).press("Enter");
      await activity.filter({ hasText: /^Thinking…$/ }).waitFor();
    } finally {
      release.resolve();
    }

    await activity.filter({ hasText: /^Creating meeting…$/ }).waitFor();
    const approval = await approvalResponse;

    assert.equal(approval.status(), 200);
    const reply = dialog
      .getByRole("article")
      .getByText(/^Your meeting with Freeman is confirmed for .*12:30 London time\.$/);

    await reply.waitFor();
    assert.equal(await activity.count(), 0);
    const observed = JSON.parse(
      (await page.locator("body").getAttribute("data-booking-activity")) ?? "[]",
    );

    assert.ok(observed.includes("Sending notification…"), JSON.stringify(observed));
    const approved = activeWorkflowSchema.parse(await (await owner.request.get(chatUrl)).json());

    assert.equal(approved.run?.outcome, "success");
    assert.equal(await reply.count(), 1);
    assert.equal(
      await dialog.getByRole("article").getByText("Confirm booking", { exact: true }).count(),
      2,
    );
    assert.equal(await dialog.getByText("Booking confirmed", { exact: true }).count(), 0);
    assert.equal(await progress.count(), 0);
    assert.equal(await review.count(), 0);
    await page.reload({ waitUntil: "load" });
    await page.getByRole("button", { name: "Open portfolio chat" }).click();
    await dialog.getByRole("heading", { name: "What would you like to know?" }).waitFor();
    const saved = activeWorkflowSchema.parse(await (await owner.request.get(chatUrl)).json());

    assert.equal(saved.id, approved.id);
    assert.deepEqual(saved.run, approved.run);
    assert.equal(await review.count(), 0);
    if (process.env.WORKFLOW_E2E_SCREENSHOT) {
      await page.screenshot({ path: process.env.WORKFLOW_E2E_SCREENSHOT });
    }

    await dialog.getByRole("button", { name: "Close assistant" }).click();
    await dialog.waitFor({ state: "hidden" });

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

    const separateComposer = separateDialog.getByRole("textbox", { name: "Your message" });

    const separateSend = separateDialog.getByRole("button", { name: "Send message" });

    await separateComposer.fill("I want to book a meeting with Freeman.");
    await separateSend.click();
    await separateDialog.getByRole("button", { name: /Book a meeting/ }).waitFor();
    await separateComposer.fill("Cancel this draft");
    await separateSend.click();
    const discard = separateDialog.getByRole("region", { name: /Discard the draft/ });

    await discard.getByRole("button", { name: "Keep draft" }).click();
    assert.ok(await (await other.request.get(chatUrl)).json());
    assert.ok(await separateDialog.getByRole("button", { name: /Book a meeting/ }).isVisible());
    await separateDialog.getByRole("button", { name: "Discard draft" }).click();
    await discard.getByRole("button", { name: "Confirm discard" }).click();
    await separateDialog
      .getByRole("button", { name: /Book a meeting/ })
      .waitFor({ state: "hidden" });
    await separatePage.reload();
    await separatePage.getByRole("button", { name: "Open portfolio chat" }).click();
    assert.equal(await (await other.request.get(chatUrl)).json(), null);
    assert.equal(await separateDialog.getByRole("button", { name: /Book a meeting/ }).count(), 0);
  },
);
