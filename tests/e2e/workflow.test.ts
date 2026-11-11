import assert from "node:assert/strict";
import test from "node:test";
import { activeWorkflowSchema } from "@/contracts/assistant.contract";

const workflowUrl = process.env.WORKFLOW_E2E_URL;

const browserConfigPath = "./browser.config.mjs";

test(
  "Meeting progress appears after start and restores only in the owning browser session",
  {
    timeout: 120_000,
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

    const owner = await browser.newContext({ reducedMotion: "reduce" });

    const page = await owner.newPage();

    page.setDefaultTimeout(10000);

    await page.goto(workflowUrl, { waitUntil: "load" });
    await page.getByRole("button", { name: "Open portfolio chat" }).click();
    const dialog = page.getByRole("dialog", { name: "Freeman’s assistant" });

    await dialog
      .getByRole("textbox", { name: "Your message" })
      .fill("I want to book a meeting with Freeman.");
    await dialog.getByRole("button", { name: "Send message" }).click();

    const progress = dialog.getByRole("button", { name: /Meeting booking/ });

    await progress.waitFor();
    assert.ok(await progress.getByText("In progress", { exact: true }).isVisible());
    assert.ok(
      await dialog.getByText("What would you like to discuss?", { exact: true }).isVisible(),
    );
    await progress.focus();
    await progress.press("Enter");
    await dialog.getByText("Not provided", { exact: true }).waitFor();
    assert.ok(await dialog.getByText("Topic", { exact: true }).isVisible());

    const started = await owner.request.get(chatUrl);

    assert.equal(started.status(), 200);
    const instance = activeWorkflowSchema.parse(await started.json());

    await page.reload({ waitUntil: "load" });
    const [restored] = await Promise.all([
      page.waitForResponse(
        (response: { url(): string; request(): { method(): string } }) =>
          response.url() === chatUrl && response.request().method() === "GET",
      ),
      page.getByRole("button", { name: "Open portfolio chat" }).click(),
    ]);

    assert.equal(restored.status(), 200);
    assert.deepEqual(activeWorkflowSchema.parse(await restored.json()), instance);
    await progress.waitFor();
    assert.ok(
      await dialog.getByText("What would you like to discuss?", { exact: true }).isVisible(),
    );

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
    assert.equal(await separateDialog.getByRole("button", { name: /Meeting booking/ }).count(), 0);
  },
);
