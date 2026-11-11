import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { browserExecutables, homepageUrl as base, playwrightModule } from "./browser.config.mjs";

const { chromium, webkit } = await import(playwrightModule);

const artifacts = process.env.HOMEPAGE_ARTIFACTS;

const documentReady = { waitUntil: "domcontentloaded" };

const sections = [
  "hero-heading",
  "work",
  "experience",
  "services",
  "testimonials",
  "outside-engineering",
  "contact",
];

if (artifacts) {
  await mkdir(artifacts, { recursive: true });
}

const response =
  [
    { type: "delta", delta: "Here is the context for your project." },
    {
      type: "sources",
      sources: [
        { id: "journey", title: "Career journey", url: "/#experience" },
        { id: "project", title: "JPScents", url: "/work/jpscents" },
        { id: "services", title: "Services", url: "/#services" },
        { id: "profile", title: "Profile", url: "/#top" },
        { id: "retired", title: "Retired audit", url: "/#audit" },
      ],
    },
    { type: "done" },
  ]
    .map((event) => JSON.stringify(event))
    .join("\n") + "\n";

const mixedQuestion = "Did Freeman pilot Apollo 11? I also want to leave a message.";

const portfolioNotice = "I couldn’t find enough information in the portfolio to answer that.";

const mixedResponse =
  [
    { type: "delta", delta: `${portfolioNotice}\n\n` },
    { type: "sources", sources: [] },
    {
      type: "choice",
      choice: {
        question: "What kind of message is this?",
        options: ["Software consulting", "Collaboration"],
      },
    },
    { type: "delta", delta: portfolioNotice },
    { type: "done" },
  ]
    .map((event) => JSON.stringify(event))
    .join("\n") + "\n";

async function focused(locator) {
  await locator.and(locator.page().locator(":focus")).waitFor();
}

async function verifyQuotePreview(control) {
  await control.waitFor();
  const { lineCount, sharesLastLine } = await control.evaluate((button) => {
    const text = button.closest(".home-quote-text");

    const words = Array.from(text.querySelectorAll(".home-quote-word"), (word) =>
      word.getBoundingClientRect(),
    );

    const last = words.at(-1);

    const label = button.getBoundingClientRect();

    const lineHeight = parseFloat(getComputedStyle(text).lineHeight);

    const lineCount = Math.round((last.top - words[0].top) / lineHeight) + 1;

    const sharesLastLine =
      Math.abs((label.top + label.bottom - last.top - last.bottom) / 2) < lineHeight / 2;

    return { lineCount, sharesLastLine };
  });

  assert.equal(lineCount, 4, "collapsed testimonial displays four lines of quote text");
  assert.ok(sharesLastLine, "read more shares the fourth line");
}

async function journey(browser, phone) {
  const viewport = phone ? { width: 390, height: 844 } : { width: 1440, height: 960 };

  const context = await browser.newContext({
    viewport,
    hasTouch: phone,
    isMobile: phone,
    reducedMotion: "reduce",
  });

  const page = await context.newPage();

  page.setDefaultTimeout(6500);

  const errors = [];

  const requests = [];

  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/chat", async (route) => {
    const request = route.request().postDataJSON();

    requests.push(request);
    await route.fulfill({
      contentType: "application/x-ndjson",
      body: request.message === mixedQuestion ? mixedResponse : response,
    });
  });

  const click = (locator) => (phone ? locator.tap() : locator.click());

  const launcher = page.getByRole("button", { name: "Open portfolio chat" });

  const closeChat = page.getByRole("button", { name: "Close assistant" });

  const message = page.getByRole("textbox", { name: "Your message" });

  const theme = page.getByRole("switch", { name: "Dark mode" });

  const menu = page.locator(".site-mobile-menu");

  const menuButton = page.locator(".site-menu-trigger");

  try {
    await page.goto(base, documentReady);
    await launcher.waitFor();
    assert.deepEqual(
      await page
        .locator("main > section")
        .evaluateAll((elements) =>
          elements.map((element) => element.getAttribute("aria-labelledby")),
        ),
      sections,
    );
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    assert.equal(
      await page.getByRole("link", { name: "Explore my work" }).getAttribute("href"),
      "/#work",
    );
    assert.equal(
      await page.getByRole("link", { name: "Contact Me" }).getAttribute("href"),
      "mailto:freemanmadudili@gmail.com",
    );
    assert.deepEqual(
      await page.locator("#work").locator("xpath=../..").locator("article h3").allTextContents(),
      ["JPScents", "Debby Art & Prints", "Pay4Me / WithRadius"],
    );
    assert.equal(
      await page.getByRole("link", { name: "Visit JPScents website" }).getAttribute("href"),
      "https://jpscents.shop",
    );
    assert.equal(
      await page
        .getByRole("link", { name: "Visit Pay4Me / WithRadius website" })
        .getAttribute("href"),
      "https://withradius.com/",
    );
    assert.equal(await page.getByRole("link", { name: /Read .* case study/ }).count(), 3);
    assert.equal(
      await page.getByRole("link", { name: "View rest of work" }).getAttribute("href"),
      "/work",
    );
    assert.equal(
      await page.getByRole("link", { name: "Visit Debby Art & Prints website" }).count(),
      0,
    );

    if (phone) {
      const header = await page.locator(".site-nav").boundingBox();

      assert.equal(header.x, 12);
      assert.equal(header.y, 16);
      assert.equal(header.width, 366);
      await click(menuButton);
      await focused(menu.getByRole("link", { name: "Work" }));
      assert.equal(await page.locator("main").evaluate((element) => element.inert), true);
      await page.keyboard.press("Shift+Tab");
      await focused(menuButton);
      await page.keyboard.press("Shift+Tab");
      await focused(theme);
      await page.keyboard.press("Shift+Tab");
      await focused(menu.getByRole("link", { name: "Let’s talk" }));
      await click(theme);
      assert.equal(await menuButton.getAttribute("aria-expanded"), "true");
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector("main").inert);
      await focused(menuButton);

      await page.emulateMedia({ reducedMotion: "no-preference" });
      await click(menuButton);
      await click(menuButton);
      assert.equal(await page.locator("main").evaluate((element) => element.inert), true);
      await click(menuButton);
      assert.equal(await menuButton.getAttribute("aria-expanded"), "true");
      await click(menuButton);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(() => !document.querySelector("main").inert);
      await focused(menuButton);

      await click(menuButton);
      await click(menu.getByRole("link", { name: "Freeman" }));
      await page.waitForURL("**/#experience", documentReady);
      await focused(page.locator("#experience"));
    } else {
      await click(theme);
      await click(
        page
          .getByRole("navigation", { name: "Main navigation" })
          .getByRole("link", { name: "Freeman" }),
      );
      await page.waitForURL("**/#experience", documentReady);
    }

    await page.reload(documentReady);
    assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
    await page.waitForFunction(() => {
      const heading = document.querySelector("#experience").getBoundingClientRect();

      return heading.top >= 86 && heading.top < innerHeight / 2;
    });
    await click(theme);

    const whatsApp = page.getByRole("button", { name: "Why WhatsApp?", exact: true });

    await click(whatsApp);
    await focused(closeChat);
    assert.equal(await message.inputValue(), "Why WhatsApp?");
    await page.getByText("About JPScents", { exact: true }).waitFor();
    assert.equal(requests.length, 0);
    await message.fill("How did WhatsApp fit the buying journey?");
    await click(page.getByRole("button", { name: "Send message" }));
    await page.getByText("Here is the context for your project.").waitFor();
    assert.deepEqual(requests, [
      {
        message: "Context: JPScents\n\nHow did WhatsApp fit the buying journey?",
        previousResponseId: null,
        workflowInstanceId: null,
      },
    ]);
    assert.equal(
      await page.getByRole("link", { name: /Career journey/ }).getAttribute("href"),
      "/#experience",
    );
    assert.equal(
      await page.getByRole("link", { name: /JPScents.*jpscents/ }).getAttribute("href"),
      "/work/jpscents",
    );
    assert.equal(await page.getByText("Retired audit").count(), 0);
    await click(closeChat);
    await closeChat.waitFor({ state: "hidden" });
    await focused(whatsApp);
    if (phone) {
      await page.emulateMedia({ reducedMotion: "no-preference" });
    }

    await click(launcher);
    await focused(closeChat);
    const experienceSource = page.getByRole("link", { name: /Career journey/ });

    if (phone) {
      await click(experienceSource);
    } else {
      await experienceSource.focus();
      await experienceSource.press("Enter");
    }

    await closeChat.waitFor({ state: "hidden" });
    await page.waitForURL("**/#experience", documentReady);
    await focused(page.locator("#experience[data-portfolio-highlight]"));
    assert.equal(
      await page
        .locator("#experience")
        .evaluate((heading) => getComputedStyle(heading).animationName),
      phone ? "portfolio-anchor-highlight" : "none",
    );
    assert.equal(requests.length, 1);
    await page.emulateMedia({ reducedMotion: "reduce" });

    const pay4me = page.getByRole("button", { name: /2022–2023 Pay4Me/ });

    if (phone) {
      await click(pay4me);
    } else {
      await pay4me.focus();
      await pay4me.press("Enter");
    }

    const closeDetail = page.getByRole("button", { name: "Close experience detail" });

    await focused(closeDetail);
    await page.keyboard.press("Escape");
    await closeDetail.waitFor({ state: "hidden" });
    await focused(pay4me);
    await click(pay4me);
    if (!phone) {
      await page.mouse.click(30, 130);
      await closeDetail.waitFor({ state: "hidden" });
      await focused(pay4me);
      await click(pay4me);
    }

    await click(
      page
        .getByRole("dialog", { name: "Pay4Me" })
        .getByRole("button", { name: "Why a bank partner?" }),
    );
    await closeDetail.waitFor({ state: "hidden" });
    await focused(closeChat);
    assert.equal(await message.inputValue(), "Why a bank partner?");
    await page.getByText("About Pay4Me", { exact: true }).waitFor();
    await page.getByText("Here is the context for your project.").waitFor();
    assert.equal(requests.length, 1);
    await click(closeChat);
    await closeChat.waitFor({ state: "hidden" });
    await focused(pay4me);

    for (const [title, draft] of [
      ["Product development", "I’d like to discuss product development."],
      ["Automation + AI", "I’d like to discuss automation and AI."],
    ]) {
      const request = page
        .locator("article")
        .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
        .getByRole("button", { name: "Request services" });

      await click(request);
      await focused(closeChat);
      assert.equal(await message.inputValue(), draft);
      await page.getByText(`About ${title}`, { exact: true }).waitFor();
      assert.equal(requests.length, 1);
      await click(closeChat);
      await closeChat.waitFor({ state: "hidden" });
      await focused(request);
    }

    const more = page.getByRole("button", { name: "Read more of this testimonial" });

    const less = page.getByRole("button", { name: "Read less of this testimonial" });

    const next = page.getByRole("button", { name: "Next testimonial" });

    const previous = page.getByRole("button", { name: "Previous testimonial" });

    await page.waitForFunction(() => document.fonts.status === "loaded");
    if (phone) {
      await verifyQuotePreview(more);
    } else {
      assert.equal(await more.count(), 0);
    }

    await click(next);
    await verifyQuotePreview(more);
    await more.focus();
    await more.press("Enter");
    await focused(less);
    assert.equal(await less.getAttribute("aria-expanded"), "true");
    await less.press("Enter");
    await focused(more);
    await more.press("Enter");
    await click(previous);
    await click(next);
    await more.waitFor();
    assert.equal(await more.getAttribute("aria-expanded"), "false");

    const retiredResponse = await page.request.get(`${base}/admin/projects`);

    assert.equal(retiredResponse.status(), 404);
    for (const [title, hash] of [
      ["Services", "services"],
      ["Profile", "top"],
    ]) {
      await click(launcher);
      await focused(closeChat);
      await click(
        page
          .getByRole("link", { name: new RegExp(`^${title}`) })
          .and(page.locator(`[href="/#${hash}"]`))
          .and(page.locator(".assistant-sources a")),
      );
      await closeChat.waitFor({ state: "hidden" });
      await page.waitForURL(`**/#${hash}`, documentReady);
      await focused(page.locator(`#${hash}[data-portfolio-highlight]`));
    }

    await click(launcher);
    await focused(closeChat);
    await click(page.getByRole("link", { name: /JPScents.*jpscents/ }));
    await page.waitForURL("**/work/jpscents", documentReady);
    await closeChat.waitFor({ state: "hidden" });
    await page.getByRole("heading", { name: "JPScents", exact: true, level: 1 }).waitFor();
    await click(launcher);
    await message.fill(mixedQuestion);
    await click(page.getByRole("button", { name: "Send message" }));
    await page.getByText("What kind of message is this?", { exact: true }).waitFor();
    await page.getByText("Software consulting", { exact: true }).waitFor();
    const notice = page.getByText(portfolioNotice, { exact: true });

    await notice.waitFor();
    assert.equal(await notice.count(), 1);
    assert.deepEqual(errors, []);
    console.log(
      `${browser.browserType().name()} ${phone ? "390px touch" : "1440px keyboard/pointer"}: passed`,
    );
  } finally {
    await context.close();
  }
}

async function visualEvidence(browser) {
  if (!artifacts) {
    return;
  }

  for (const [name, width, height] of [
    ["desktop", 1440, 960],
    ["phone", 390, 844],
    ["narrow", 320, 568],
    ["tablet", 768, 1024],
    ["landscape", 844, 390],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: "reduce",
      hasTouch: width < 700 || height < 450,
    });

    await page.goto(base, documentReady);
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (const image of document.images) {
        if (image.loading === "lazy" && image.getClientRects().length) {
          image.loading = "eager";
        }
      }

      await Promise.all(
        Array.from(document.images)
          .filter((image) => image.getClientRects().length)
          .map((image) => image.decode()),
      );
    });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForFunction(
      () =>
        document
          .querySelector(".home-portrait-scroll")
          .style.getPropertyValue("--portrait-light") === "0.55",
    );
    await page.locator(".home-hero").evaluate(async (hero) => {
      await Promise.all(
        hero.getAnimations({ subtree: true }).map((animation) => animation.finished),
      );
    });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, name);
    await page.screenshot({
      path: join(artifacts, `${name}-dark.jpg`),
      fullPage: true,
      quality: 80,
    });
    await page.getByRole("switch", { name: "Dark mode" }).click();
    await page.screenshot({
      path: join(artifacts, `${name}-light.jpg`),
      fullPage: true,
      quality: 80,
    });
    if (height < 450) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page.getByRole("link", { name: "Let’s talk" }).click();
      await page.waitForURL("**/#contact", documentReady);
    }

    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  await page.goto(base, documentReady);
  await page.locator(".home-hero-labels").waitFor();
  for (const [index, elapsed] of [200, 600, 1050, 1600, 2150].entries()) {
    await page.evaluate((time) => {
      for (const animation of document
        .querySelector(".home-hero")
        .getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = time;
      }
    }, elapsed);
    await page.screenshot({ path: join(artifacts, `hero-${index}.jpg`), quality: 75 });
  }

  for (const [index, fraction] of [0.8, 0.5, 0.2, 0.5, 0.8].entries()) {
    await page.locator(".home-timeline").evaluate(
      (rail, value) =>
        window.scrollBy({
          top: rail.getBoundingClientRect().top - innerHeight * value,
          behavior: "instant",
        }),
      fraction,
    );
    await page.waitForFunction((value) => {
      const rail = document.querySelector(".home-timeline");

      return (
        Math.abs(
          Number(rail.style.getPropertyValue("--rail-progress")) -
            Math.max(0, Math.min(1, (0.75 - value) / 0.5)),
        ) < 0.025
      );
    }, fraction);
    await page.screenshot({ path: join(artifacts, `rail-${index}.jpg`), quality: 75 });
  }

  await page.getByRole("button", { name: "Next testimonial" }).click();
  const more = page.getByRole("button", { name: "Read more of this testimonial" });

  await verifyQuotePreview(more);
  await page
    .locator(".home-testimonial")
    .evaluate((quote) =>
      window.scrollBy({ top: quote.getBoundingClientRect().top - 210, behavior: "instant" }),
    );
  await page
    .locator(".home-testimonial-reveal")
    .evaluate(async (section) =>
      Promise.all(section.getAnimations({ subtree: true }).map((animation) => animation.finished)),
    );
  await more.evaluate((button) => button.focus({ preventScroll: true }));
  await page.screenshot({ path: join(artifacts, "quote-0.jpg"), quality: 75 });
  await page.keyboard.press("Enter");
  const frame = page.locator(".home-quote-frame");

  await frame.evaluate((quote) => {
    const animation = quote.getAnimations()[0];

    animation.pause();
    animation.currentTime = 95;
  });
  await page.screenshot({ path: join(artifacts, "quote-1.jpg"), quality: 75 });
  await frame.evaluate((quote) => quote.getAnimations()[0].finish());
  await page.screenshot({ path: join(artifacts, "quote-2.jpg"), quality: 75 });
  await page.close();
}

for (const [engine, executablePath] of [
  [chromium, browserExecutables.chromium],
  [webkit, browserExecutables.webkit],
]) {
  const browser = await engine.launch({ executablePath });

  try {
    await journey(browser, false);
    await journey(browser, true);
    if (engine === chromium) {
      await visualEvidence(browser);
    }
  } finally {
    await browser.close();
  }
}
