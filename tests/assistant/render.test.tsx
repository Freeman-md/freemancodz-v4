import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MotionConfig } from "framer-motion";

import { AssistantMarkdown } from "@/features/assistant/components/AssistantMarkdown";
import { FloatingPortfolioChat } from "@/features/assistant/components/FloatingPortfolioChat";
import { OPEN_PORTFOLIO_CHAT_EVENT } from "@/features/assistant/assistant.events";

function streamResponse(lines: string[]) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      start(controller) {
        for (const line of lines) {
          controller.enqueue(encoder.encode(line));
        }

        controller.close();
      },
    }),
  );
}

test("assistant markdown renders supported formatting without raw HTML", () => {
  const html = renderToStaticMarkup(
    <AssistantMarkdown
      content={
        "# Heading\n\nParagraph with *emphasis* and `code`.\n\n- first\n- second\n\n[Internal](/work) [External](https://example.com)\n\n<script>unsafe</script>"
      }
    />,
  );

  assert.match(html, /<h1[^>]*>Heading<\/h1>/);
  assert.match(html, /<p[^>]*>Paragraph with <em>emphasis<\/em> and <code/);
  assert.match(html, /<ul/);
  assert.match(html, /href="\/work"/);
  assert.doesNotMatch(html, /<script>/);
});

test("floating assistant opens and closes through controls, Escape, and outside click", async () => {
  const dom = new JSDOM(
    "<!doctype html><html><body><button id=outside>Outside</button><div id=root></div></body></html>",
    { url: "https://example.test" },
  );

  const { window } = dom;

  Object.assign(globalThis, {
    window,
    document: window.document,
    Node: window.Node,
    HTMLElement: window.HTMLElement,
  });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: window.navigator });
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(window, "matchMedia", {
    value: () => ({
      matches: true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
  Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", { value: () => undefined });
  Object.defineProperty(window.HTMLElement.prototype, "attachEvent", { value: () => undefined });
  Object.defineProperty(window.HTMLElement.prototype, "detachEvent", { value: () => undefined });
  const container = window.document.querySelector("#root");

  assert.ok(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(<FloatingPortfolioChat />);
  });
  const launcher = window.document.querySelector<HTMLButtonElement>(
    '[aria-label="Open portfolio chat"]',
  );

  assert.ok(launcher);
  await act(async () => {
    launcher.click();
  });
  assert.ok(
    window.document.querySelector('[aria-label="Ask a question about Freeman\'s portfolio"]'),
  );

  await act(async () => {
    window.document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });
  assert.ok(window.document.querySelector('[aria-label="Open portfolio chat"]'));

  const reopened = window.document.querySelector<HTMLButtonElement>(
    '[aria-label="Open portfolio chat"]',
  );

  assert.ok(reopened);
  await act(async () => {
    reopened.click();
  });
  await act(async () => {
    window.document
      .querySelector<HTMLButtonElement>("#outside")
      ?.dispatchEvent(new window.MouseEvent("pointerdown", { bubbles: true }));
  });
  assert.ok(window.document.querySelector('[aria-label="Open portfolio chat"]'));
  await act(async () => {
    root.unmount();
  });
  dom.window.close();
});

test("assistant opens from its global event and reveals a complete stream progressively", async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", {
    url: "https://example.test",
  });

  const { window } = dom;

  const originalFetch = globalThis.fetch;

  Object.assign(globalThis, {
    window,
    document: window.document,
    Node: window.Node,
    HTMLElement: window.HTMLElement,
  });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: window.navigator });
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(window, "matchMedia", {
    value: () => ({ matches: false, addEventListener: () => undefined, removeEventListener: () => undefined }),
  });
  Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", { value: () => undefined });
  Object.defineProperty(window.HTMLElement.prototype, "attachEvent", { value: () => undefined });
  Object.defineProperty(window.HTMLElement.prototype, "detachEvent", { value: () => undefined });
  globalThis.fetch = async () =>
    streamResponse([
      '{"type":"delta","delta":"abcdefgh"}\n',
      '{"type":"delta","delta":"ijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"}\n',
      '{"type":"response_id","responseId":"resp_1"}\n',
      '{"type":"done"}\n',
    ]);
  const container = window.document.querySelector("#root");

  assert.ok(container);
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(<FloatingPortfolioChat />);
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await act(async () => {
      window.dispatchEvent(
        new window.CustomEvent(OPEN_PORTFOLIO_CHAT_EVENT, { detail: { message: "Hello" } }),
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 24));
    });
    assert.match(window.document.body.textContent ?? "", /abcdefgh/);
    assert.doesNotMatch(
      window.document.body.textContent ?? "",
      /abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 160));
    });
    assert.match(
      window.document.body.textContent ?? "",
      /abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/,
    );
    assert.equal(
      window.document.querySelector<HTMLTextAreaElement>("#portfolio-chat-input")?.ownerDocument
        .activeElement?.id,
      "portfolio-chat-input",
    );
  } finally {
    globalThis.fetch = originalFetch;
    await act(async () => {
      root.unmount();
    });
    dom.window.close();
  }
});

test("assistant bypasses pacing when reduced motion is preferred", async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id=root></div></body></html>", {
    url: "https://example.test",
  });

  const { window } = dom;

  const originalFetch = globalThis.fetch;

  Object.assign(globalThis, {
    window,
    document: window.document,
    Node: window.Node,
    HTMLElement: window.HTMLElement,
  });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: window.navigator });
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(window, "matchMedia", {
    value: () => ({ matches: true, addEventListener: () => undefined, removeEventListener: () => undefined }),
  });
  Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", { value: () => undefined });
  Object.defineProperty(window.HTMLElement.prototype, "attachEvent", { value: () => undefined });
  Object.defineProperty(window.HTMLElement.prototype, "detachEvent", { value: () => undefined });
  globalThis.fetch = async () =>
    streamResponse(['{"type":"delta","delta":"immediate response"}\n', '{"type":"done"}\n']);
  const container = window.document.querySelector("#root");

  assert.ok(container);
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(
        <MotionConfig reducedMotion="always">
          <FloatingPortfolioChat />
        </MotionConfig>,
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await act(async () => {
      window.dispatchEvent(
        new window.CustomEvent(OPEN_PORTFOLIO_CHAT_EVENT, { detail: { message: "Hello" } }),
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.match(window.document.body.textContent ?? "", /immediate response/);
  } finally {
    globalThis.fetch = originalFetch;
    await act(async () => {
      root.unmount();
    });
    dom.window.close();
  }
});
