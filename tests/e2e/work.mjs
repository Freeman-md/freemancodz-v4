import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { browserExecutables, homepageUrl as base, playwrightModule } from "./browser.config.mjs";

const { chromium, webkit } = await import(playwrightModule);

const mediaBase = process.env.PORTFOLIO_MEDIA_FIXTURE_URL;

const artifacts = process.env.PORTFOLIO_ARTIFACTS;

const documentReady = { waitUntil: "domcontentloaded" };

const orderedTitles = [
  "JPScents",
  "Debby Art & Prints",
  "Pay4Me / WithRadius",
  "Portfolio Assistant",
  "Email PA",
  "Across the Horizon",
  "Interface Studies",
  "Email Sequencer",
  "Self-Healing Backend Ops",
];

async function assertFocused(locator) {
  await locator.and(locator.page().locator(":focus")).waitFor();
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

  page.setDefaultTimeout(8500);
  const click = (target) => (phone ? target.tap() : target.click());

  const errors = [];

  let requests = 0;

  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/chat", (route) => {
    requests += 1;

    return route.fulfill({
      status: 200,
      contentType: "application/x-ndjson",
      body: '{"type":"done"}\n',
    });
  });

  try {
    await page.goto(base, documentReady);
    const homeCase = page.getByRole("link", { name: "Read JPScents case study" });

    assert.equal(await homeCase.getAttribute("href"), "/work/jpscents");
    const more = page.getByRole("link", { name: "View rest of work" });

    await click(more);
    await page.waitForURL("**/work", documentReady);
    await page.getByRole("heading", { name: "/ SELECTED WORK" }).waitFor();
    await page.locator('head link[rel="canonical"][href$="/work"]').waitFor({ state: "attached" });
    assert.match(await page.title(), /^Work/);
    const workDocument = await (await page.request.get(`${base}/work`)).text();

    assert.deepEqual(
      Array.from(
        workDocument.matchAll(/<link rel="canonical" href="([^"]+)"/g),
        ([, href]) => new URL(href).pathname,
      ),
      ["/work"],
    );
    assert.equal(await page.getByRole("link", { name: /View (all|rest of) work/ }).count(), 0);
    assert.equal(await page.locator("#catalogue-results .home-project-excerpts").count(), 0);

    for (const [name, expected] of [
      ["All", orderedTitles],
      ["Explorations", orderedTitles.slice(6)],
      ["Real projects", orderedTitles.slice(0, 6)],
      ["All", orderedTitles],
    ]) {
      const filter = page.getByRole("button", { name, exact: true });

      if (phone) {
        await click(filter);
      } else {
        await filter.focus();
        await filter.press("Space");
        await assertFocused(filter);
      }

      assert.equal(await filter.getAttribute("aria-pressed"), "true");
      assert.deepEqual(
        await page.locator("#catalogue-results article h3").allTextContents(),
        expected,
      );
      assert.equal(
        await page.getByRole("status").textContent(),
        `${expected.length} projects shown`,
      );
    }

    assert.equal(
      await page
        .getByRole("link", { name: "Visit Debby Art & Prints website" })
        .getAttribute("href"),
      "https://www.debbyartprints.com.ng",
    );
    assert.equal(
      await page.getByRole("link", { name: "Visit JPScents website" }).getAttribute("href"),
      "https://jpscents.shop",
    );
    assert.equal(
      await page
        .getByRole("link", { name: /^View the (Debby Art & Prints|JPScents|Email PA) repository$/ })
        .count(),
      0,
    );
    const assistantCard = page
      .locator("#catalogue-results article")
      .filter({ has: page.getByRole("heading", { name: "Portfolio Assistant", exact: true }) });

    assert.equal(await assistantCard.getByRole("link").count(), 1);
    await click(page.getByRole("link", { name: "Read JPScents case study" }));
    await page.waitForURL("**/work/jpscents", documentReady);
    await page.getByRole("heading", { name: "JPScents", level: 1 }).waitFor();
    const refreshed = await page.reload(documentReady);

    assert.equal(refreshed?.status(), 200);
    assert.match(await page.title(), /^JPScents/);
    assert.match(
      await page.locator('link[rel="canonical"]').getAttribute("href"),
      /\/work\/jpscents$/,
    );
    assert.equal(
      await page.getByRole("link", { name: "Visit JPScents", exact: true }).getAttribute("href"),
      "https://jpscents.shop",
    );
    assert.equal(await page.locator(".case-comparison").count(), 0);
    assert.equal(
      await page.getByRole("button", { name: /Request Product development/ }).isDisabled(),
      true,
    );
    const question = page.getByRole("button", { name: "Why did you keep WhatsApp for payment?" });

    await click(question);
    const close = page.getByRole("button", { name: "Close assistant" });

    await assertFocused(close);
    assert.equal(
      await page.getByRole("textbox", { name: "Your message" }).inputValue(),
      "Why did you keep WhatsApp for payment?",
    );
    assert.equal(requests, 0);
    await click(close);
    await close.waitFor({ state: "hidden" });
    await assertFocused(question);

    await page.goto(`${base}/work/interface-studies`, documentReady);
    await page.getByRole("heading", { name: "What I explored" }).waitFor();
    await page.getByRole("heading", { name: "What I learned" }).waitFor();
    assert.equal(await page.locator(".case-comparison").count(), 0);
    assert.equal(
      await page.getByRole("link", { name: "View the UI Builds repository" }).getAttribute("href"),
      "https://github.com/Freeman-md/ui-builds",
    );
    await page.goto(`${base}/work/email-pa`, documentReady);
    assert.equal(await page.locator(".case-banner a").count(), 0);
    assert.equal(
      await page.getByRole("button", { name: /Request Automation \+ AI/ }).isDisabled(),
      true,
    );
    await page.goto(`${base}/work/portfolio-assistant`, documentReady);
    assert.equal(await page.locator(".case-banner a").count(), 0);
    assert.deepEqual(
      await page.locator(".case-facts > div").last().locator("dd").allTextContents(),
      ["Product development", "Automation + AI"],
    );
    const missing = await page.goto(`${base}/work/missing-project`, documentReady);

    assert.equal(missing?.status(), 404);
    assert.match(await missing.text(), /<h1[^>]*>Page not found<\/h1>/);
    assert.equal(
      await page.getByRole("link", { name: "Back to Work" }).getAttribute("href"),
      "/work",
    );

    for (const route of [
      "/admin",
      "/admin/login",
      "/auth/confirm",
      "/api/admin/media",
      "/api/internal/search-index-worker",
    ]) {
      assert.equal((await page.request.get(base + route)).status(), 404, route);
    }

    await page.goto(`${base}/work/jpscents`, documentReady);
    if (phone) {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      const menu = page.getByRole("button", { name: "Open navigation" });

      await click(menu);
      await click(page.locator(".site-mobile-menu").getByRole("link", { name: "Freeman" }));
      await page.waitForFunction(
        () =>
          document.querySelector("header.site-header").dataset.menu === "closing" &&
          location.pathname === "/work/jpscents",
      );
    } else {
      await click(
        page
          .getByRole("navigation", { name: "Main navigation" })
          .getByRole("link", { name: "Freeman" }),
      );
    }

    await page.waitForURL("**/#experience", documentReady);
    await page.waitForFunction(() => {
      const anchor = document.querySelector("#experience");

      return (
        anchor &&
        anchor.getBoundingClientRect().top >= 82 &&
        anchor.getBoundingClientRect().top < innerHeight
      );
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await click(page.getByRole("button", { name: /2022–2023 Pay4Me/ }));
    const experience = page.getByRole("dialog", { name: "Pay4Me" });

    await click(experience.getByRole("button", { name: "Why a bank partner?" }));
    await experience.waitFor({ state: "hidden" });
    await assertFocused(close);
    assert.equal(
      await page.getByRole("textbox", { name: "Your message" }).inputValue(),
      "Why a bank partner?",
    );
    assert.equal(requests, 0);
    assert.deepEqual(errors, []);

    console.log(
      `${browser.browserType().name()} ${phone ? "390px touch" : "1440px keyboard/pointer"} work journey passed`,
    );
  } finally {
    await context.close();
  }
}

async function capture(browser) {
  if (!artifacts) {
    return;
  }

  await mkdir(artifacts, { recursive: true });
  for (const [name, width, height] of [
    ["desktop", 1440, 960],
    ["phone", 390, 844],
    ["narrow", 320, 640],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });

    page.setDefaultTimeout(8500);
    for (const [subject, path] of [
      ["work", "/work"],
      ["jpscents", "/work/jpscents"],
      ["exploration", "/work/interface-studies"],
      ["automation", "/work/email-pa"],
    ]) {
      await page.goto(base + path, documentReady);

      const artwork = "main img[alt]:not([alt=''])";

      await page.locator(artwork).evaluateAll((images) => {
        for (const image of images) {
          image.loading = "eager";
        }
      });

      await page.waitForFunction(
        (selector) =>
          document.fonts.status === "loaded" &&
          Array.from(document.querySelectorAll(selector)).every(
            (image) => image.complete && image.naturalWidth > 0,
          ),
        artwork,
      );
      await page.evaluate(() => window.scrollTo(0, 0));
      const actualWidth = await page.evaluate(() => document.documentElement.scrollWidth);

      assert.equal(actualWidth, width, `${subject} ${name} has no horizontal overflow`);
      await page.screenshot({
        path: join(artifacts, `${subject}-${name}-dark.jpg`),
        fullPage: true,
        quality: 80,
      });
      await page.getByRole("switch", { name: "Dark mode" }).click();
      assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        width,
        `${subject} ${name} light has no horizontal overflow`,
      );
      await page.screenshot({
        path: join(artifacts, `${subject}-${name}-light.jpg`),
        fullPage: true,
        quality: 80,
      });
      await page.getByRole("switch", { name: "Dark mode" }).click();
    }

    await page.close();
  }
}

async function playback(browser) {
  if (!mediaBase) {
    return;
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.setDefaultTimeout(8500);
  await page.goto(`${mediaBase}/work/jpscents`, documentReady);
  assert.deepEqual(await page.locator(".case-media h3").allTextContents(), ["Before", "After"]);
  const frames = await page.locator(".case-media-frame").all();

  const first = await frames[0].boundingBox();

  const second = await frames[1].boundingBox();

  assert.ok(first && second && Math.abs(first.width / first.height - 16 / 9) < 0.03);
  assert.equal(Math.round(first.width), Math.round(second.width));
  assert.ok(Math.abs(first.y - second.y) < 2);
  const after = page.locator(".case-media").last();

  const video = after.locator("video");

  await video.scrollIntoViewIfNeeded();
  const pause = page.getByRole("button", { name: "Pause After" });

  const play = page.getByRole("button", { name: "Play After" });

  await pause.waitFor();
  assert.equal(
    await video.evaluate((element) => element.muted && element.loop && !element.paused),
    true,
  );
  if (artifacts && browser.browserType().name() === "chromium") {
    await after.screenshot({ path: join(artifacts, "media-playing.png") });
  }

  await pause.click();
  await play.waitFor();
  await page.locator("h1").scrollIntoViewIfNeeded();
  await video.scrollIntoViewIfNeeded();
  await play.waitFor();
  assert.equal(await video.evaluate((element) => element.paused), true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload(documentReady);
  await video.scrollIntoViewIfNeeded();
  await play.waitFor();
  assert.equal(await video.evaluate((element) => element.paused && Boolean(element.poster)), true);
  if (artifacts && browser.browserType().name() === "chromium") {
    await after.screenshot({ path: join(artifacts, "media-reduced-motion.png") });
  }

  await play.click();
  await pause.waitFor();
  await page.locator("h1").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector(".case-media:last-child video").paused);

  await page.route("**/videos/portfolio-clip.webm", (route) =>
    route.fulfill({ status: 404, body: "Fixture unavailable" }),
  );
  await page.reload(documentReady);
  await video.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector(".case-media:last-child video").error);
  assert.equal(await play.count(), 0);
  await after.locator("img").waitFor();

  await page.close();
  console.log(
    `${browser.browserType().name()} controlled playback, pause retention, and reduced motion passed`,
  );
}

for (const [engine, executablePath] of [
  [chromium, browserExecutables.chromium],
  [webkit, browserExecutables.webkit],
]) {
  const browser = await engine.launch({ executablePath });

  try {
    if (process.env.PORTFOLIO_MEDIA_ONLY !== "1") {
      await journey(browser, false);
      await journey(browser, true);
      if (engine === chromium) {
        await capture(browser);
      }
    }

    await playback(browser);
  } finally {
    await browser.close();
  }
}
