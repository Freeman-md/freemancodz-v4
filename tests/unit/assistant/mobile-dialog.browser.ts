import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";

test("mobile assistant restores page scrolling after every dismissal and unmount", async () => {
  const dom = new JSDOM("<!doctype html><html><body><main></main></body></html>", {
    url: "http://localhost:3000",
    pretendToBeVisual: true,
  });

  const previous = new Map<string, PropertyDescriptor | undefined>();

  for (const [name, value] of Object.entries({
    window: dom.window,
    self: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    Node: dom.window.Node,
    Element: dom.window.Element,
    HTMLElement: dom.window.HTMLElement,
    HTMLButtonElement: dom.window.HTMLButtonElement,
    HTMLInputElement: dom.window.HTMLInputElement,
    HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
    SVGElement: dom.window.SVGElement,
    DocumentFragment: dom.window.DocumentFragment,
    MutationObserver: dom.window.MutationObserver,
    CustomEvent: dom.window.CustomEvent,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }

  Object.defineProperty(dom.window, "matchMedia", {
    value: () => ({
      matches: true,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
    }),
  });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};

  // JSDOM has no layout; model a mobile viewport with overlay scrollbars.
  Object.defineProperty(dom.window.document.documentElement, "clientWidth", {
    value: dom.window.innerWidth,
  });
  dom.window.document.body.style.overflowY = "auto";
  const { createRoot } = await import("react-dom/client");

  const { FloatingPortfolioChat } = await import("@/app/_assistant/components/FloatingPortfolioChat");

  const root = createRoot(dom.window.document.querySelector("main")!);

  async function settleScrollLock() {
    await act(async () => {
      // The dialog releases its shared scroll lock on the next task.
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  }

  function button(label: string, last = false) {
    const buttons = Array.from(dom.window.document.querySelectorAll("button")).filter(
      (element) => element.getAttribute("aria-label") === label,
    );

    const found = last ? buttons.at(-1) : buttons[0];

    assert.ok(found, `Missing ${label} button`);

    return found;
  }

  async function open() {
    await act(async () => {
      button("Open portfolio chat").click();
    });
    await settleScrollLock();
    assert.equal(dom.window.document.body.style.overflowY, "hidden");
  }

  try {
    await act(async () => {
      root.render(createElement(FloatingPortfolioChat));
    });

    for (const dismissal of ["close", "backdrop", "escape"]) {
      await open();
      await act(async () => {
        if (dismissal === "escape") {
          dom.window.document.dispatchEvent(
            new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
          );

          return;
        }

        button("Close portfolio chat", dismissal === "close").click();
      });
      await settleScrollLock();
      assert.equal(dom.window.document.body.style.overflowY, "auto", dismissal);
      assert.equal(dom.window.document.body.style.overflow, "", dismissal);
      assert.ok(button("Open portfolio chat"));
    }

    await open();
  } finally {
    await act(async () => {
      root.unmount();
    });
    await settleScrollLock();
    const remainingOverflow = dom.window.document.body.style.overflowY;

    dom.window.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, name);
      }
    }

    assert.equal(remainingOverflow, "auto");
  }
});
