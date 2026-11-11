import assert from "node:assert/strict";
import test from "node:test";
import type { AssistantStreamEvent } from "@/contracts/assistant.contract";

type ChatRoute = {
  request(): { postDataJSON(): unknown };
  fulfill(response: { contentType: string; body: string }): Promise<void>;
};

const browserConfigPath = "./browser.config.mjs";

const question = "What kind of app are you looking to build?";

const options = ["A web app", "A mobile app"];

const choiceReply = [
  { type: "delta", delta: question },
  { type: "options", options },
  { type: "response_id", responseId: "resp_question" },
  { type: "done" },
] satisfies AssistantStreamEvent[];

const sourceReply = [
  { type: "delta", delta: "Freeman built the JPScents fragrance storefront." },
  {
    type: "sources",
    sources: [{ id: "project:jpscents", title: "JPScents", url: "/work/jpscents" }],
  },
  { type: "response_id", responseId: "resp_answer" },
  { type: "done" },
] satisfies AssistantStreamEvent[];

test("assistant browser journeys", { timeout: 120_000 }, async (t) => {
  const { browserExecutables, homepageUrl, playwrightModule } = await import(browserConfigPath);

  const { chromium, webkit } = await import(playwrightModule);

  const engines = [
    {
      name: "Chromium desktop",
      engine: chromium,
      executablePath: browserExecutables.chromium,
      phone: false,
    },
    {
      name: "WebKit touch",
      engine: webkit,
      executablePath: browserExecutables.webkit,
      phone: true,
    },
  ];

  for (const { name, engine, executablePath, phone } of engines) {
    await t.test(name, async (t) => {
      const browser = await engine.launch({ executablePath });

      t.after(() => browser.close());

      async function openHomepage() {
        const page = await browser.newPage({
          viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 960 },
          isMobile: phone,
          hasTouch: phone,
          reducedMotion: "reduce",
        });

        const requests: unknown[] = [];

        page.setDefaultTimeout(8000);
        await page.route("**/api/chat", async (route: ChatRoute) => {
          requests.push(route.request().postDataJSON());

          const events = requests.length === 1 ? choiceReply : sourceReply;

          await route.fulfill({
            contentType: "application/x-ndjson",
            body: events.map((event) => JSON.stringify(event)).join("\n") + "\n",
          });
        });
        await page.goto(homepageUrl, { waitUntil: "load" });

        return { page, requests };
      }

      await t.test("opens an editable contextual draft and sends one chosen reply", async (t) => {
        const { page, requests } = await openHomepage();

        t.after(() => page.close());

        const trigger = page.getByRole("button", { name: "Why WhatsApp?", exact: true });

        const entry = page.getByRole("textbox", { name: "Your message" });

        const dialog = page.getByRole("dialog", { name: "Freeman’s assistant" });

        // Opening the dialog confirms its event listener is ready before using the page trigger.
        await page.getByRole("button", { name: "Open portfolio chat" }).click();
        await dialog.getByRole("button", { name: "Close assistant" }).click();
        await dialog.waitFor({ state: "hidden" });

        await trigger.click();
        assert.equal(await entry.inputValue(), "Why WhatsApp?");
        assert.deepEqual(requests, []);
        await entry.fill("I want to build an app.");
        await dialog.getByRole("button", { name: "Send message" }).click();

        const suggestedReplies = dialog.getByRole("group", { name: "Suggested replies" });

        await suggestedReplies.waitFor();
        assert.ok(await dialog.getByText(question, { exact: true }).isVisible());
        assert.ok(await entry.isEditable());
        await suggestedReplies.getByRole("button", { name: "A web app", exact: true }).click();
        await dialog.getByRole("link", { name: /JPScents/ }).waitFor();
        assert.deepEqual(requests, [
          { message: "Context: JPScents\n\nI want to build an app.", previousResponseId: null },
          { message: "A web app", previousResponseId: "resp_question" },
        ]);
      });

      await t.test("accepts a typed reply and follows its source", async (t) => {
        const { page, requests } = await openHomepage();

        t.after(() => page.close());

        const entry = page.getByRole("textbox", { name: "Your message" });

        const dialog = page.getByRole("dialog", { name: "Freeman’s assistant" });

        const send = dialog.getByRole("button", { name: "Send message" });

        const suggestedReplies = dialog.getByRole("group", { name: "Suggested replies" });

        await page.getByRole("button", { name: "Open portfolio chat" }).click();
        await entry.fill("I want to build an app.");
        await send.click();
        await suggestedReplies.waitFor();
        await entry.fill("I want to build a desktop app.");
        await suggestedReplies.waitFor({ state: "hidden" });
        assert.ok(await dialog.getByText(question, { exact: true }).isVisible());
        await send.click();

        const source = dialog.getByRole("link", { name: /JPScents/ });

        await source.waitFor();
        assert.deepEqual(requests, [
          { message: "I want to build an app.", previousResponseId: null },
          { message: "I want to build a desktop app.", previousResponseId: "resp_question" },
        ]);
        assert.equal(await source.getAttribute("href"), "/work/jpscents");
        await source.click();
        await dialog.waitFor({ state: "hidden" });
        await page.waitForURL("**/work/jpscents");
        await page.getByRole("heading", { name: "JPScents", exact: true, level: 1 }).waitFor();
      });
    });
  }
});
