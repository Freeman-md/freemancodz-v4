import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const base = process.env.HOMEPAGE_URL ?? "http://localhost:3100";

const artifacts = process.env.ASSISTANT_WORKFLOW_ARTIFACTS;

const reference =
  "11111111-1111-4111-8111-111111111111.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const question = "What would you like to discuss?";

const option = "Discuss a project";

const correction = "Please use Revised Visitor";

function instance(revision, name, phase) {
  return {
    type: "workflow_instance",
    instance: {
      id: reference,
      workflowId: "meeting-booking",
      workflowVersion: 1,
      revision,
      status: phase === "completed" ? "completed" : "active",
      ...(phase === "awaiting_confirmation"
        ? {
            confirmationAction: "confirm",
            review: {
              actionKey: "book-meeting",
              title: "Review your meeting",
              fields: [{ key: "name", required: true, value: name, label: "Name" }],
            },
          }
        : {}),
      progress: {
        phase,
        fields: [{ key: "name", required: true, value: name }],
        missingRequiredFields: [],
      },
    },
  };
}

async function journey(browser, phone) {
  const context = await browser.newContext({
    viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 960 },
    isMobile: phone,
    hasTouch: phone,
    reducedMotion: "reduce",
  });

  const page = await context.newPage();

  const requests = [];

  const click = (element) => (phone ? element.tap() : element.click());

  const dialog = page.getByRole("dialog");

  const launcher = page.getByRole("button", { name: "Open portfolio chat" });

  const composer = dialog.getByRole("textbox", { name: "Your message" });

  const close = dialog.getByRole("button", { name: "Close assistant" });

  const send = () => click(dialog.getByRole("button", { name: "Send message" }));

  let saved = instance(1, "Visitor", "collecting");

  await page.route("**/api/chat", async (route) => {
    const request = route.request().postDataJSON();

    requests.push(request);
    let events;

    if (request.action === "workflow_status") {
      assert.equal(request.workflowInstanceId, reference);
      events = [saved, { type: "done" }];
    } else if (request.action === "confirm_workflow") {
      assert.equal(request.expectedRevision, 3);
      assert.equal(request.actionKey, "book-meeting");
      assert.equal(request.workflowInstanceId, reference);
      saved = instance(5, "Revised Visitor", "completed");
      events = [
        instance(4, "Revised Visitor", "processing"),
        { type: "response_id", responseId: "resp_interrupted" },
      ];
    } else if (request.message === "Book a meeting") {
      events = [
        saved,
        { type: "delta", delta: "This provisional question should be replaced." },
        { type: "choice", choice: { question, options: [option, "Discuss availability"] } },
        { type: "response_id", responseId: "resp_choice" },
        { type: "done" },
      ];
    } else if (request.message === option || request.message === correction) {
      assert.equal(request.workflowInstanceId, reference);
      saved =
        request.message === option
          ? instance(2, "Visitor", "awaiting_confirmation")
          : instance(3, "Revised Visitor", "awaiting_confirmation");
      events = [saved, { type: "done" }];
    } else {
      events = [
        { type: "delta", delta: "Freeman built the JPScents storefront." },
        {
          type: "sources",
          sources: [{ id: "jpscents", title: "JPScents", url: "/work/jpscents" }],
        },
        { type: "done" },
      ];
    }

    await route.fulfill({
      contentType: "application/x-ndjson",
      body: events.map((event) => JSON.stringify(event)).join("\n") + "\n",
    });
  });

  try {
    await page.goto(base);
    await click(launcher);
    await composer.fill("Book a meeting");
    await send();
    const choiceQuestion = dialog.getByText(question, { exact: true });

    await choiceQuestion.waitFor();
    assert.equal(await choiceQuestion.count(), 1);
    assert.equal(await dialog.getByText(/provisional question/).count(), 0);
    await click(dialog.getByRole("radio", { name: option }));
    await click(dialog.getByRole("button", { name: "Send", exact: true }));
    const review = dialog.getByRole("region", { name: "Review your meeting" });

    await review.getByText("Visitor", { exact: true }).waitFor();
    assert.equal(requests.filter(({ message }) => message === option).length, 1);
    await composer.fill(correction);
    await click(review.getByRole("button", { name: "Request changes" }));
    await composer.and(page.locator(":focus")).waitFor();
    assert.equal(await composer.inputValue(), correction);
    await send();
    await review.getByText("Revised Visitor", { exact: true }).waitFor();
    assert.equal(await review.getByText("Visitor", { exact: true }).count(), 0);
    if (artifacts) {
      await page.screenshot({
        path: join(
          artifacts,
          `review-${browser.browserType().name()}-${phone ? "phone" : "desktop"}.png`,
        ),
      });
    }

    await click(review.getByRole("button", { name: "Confirm" }));
    await dialog.getByText(/response was interrupted\. Check the saved status/).waitFor();
    await click(close);
    await close.waitFor({ state: "hidden" });
    await click(launcher);
    await dialog.getByText("Completed", { exact: false }).waitFor();
    assert.equal(requests.at(-1)?.action, "workflow_status");
    if (artifacts) {
      await page.screenshot({
        path: join(
          artifacts,
          `status-${browser.browserType().name()}-${phone ? "phone" : "desktop"}.png`,
        ),
      });
    }

    await composer.fill("What did Freeman build for JPScents?");
    await send();
    const source = dialog.getByRole("link", { name: /JPScents/ });

    await source.waitFor();
    assert.equal(requests.at(-1)?.previousResponseId, null);
    await click(source);
    await page.waitForURL("**/work/jpscents");
    await close.waitFor({ state: "hidden" });
    console.log(
      `${browser.browserType().name()} ${phone ? "phone" : "desktop"} assistant workflow passed`,
    );
  } finally {
    await context.close();
  }
}

if (artifacts) {
  await mkdir(artifacts, { recursive: true });
}

for (const [engine, executablePath] of [
  [chromium, process.env.CHROMIUM_EXECUTABLE],
  [webkit, process.env.WEBKIT_EXECUTABLE],
]) {
  const browser = await engine.launch({ executablePath });

  try {
    await journey(browser, false);
    await journey(browser, true);
  } finally {
    await browser.close();
  }
}
