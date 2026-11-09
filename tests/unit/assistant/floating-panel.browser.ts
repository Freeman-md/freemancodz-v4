import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { dispatchOpenPortfolioChat } from "@/app/_assistant/assistant.events";

function doneResponse() {
  return new Response(new ReadableStream({ start: (controller) => controller.close() }));
}

test("assistant surface opens without submitting and remains dismissible while a response is processing", async () => {
  const dom = new JSDOM("<!doctype html><html><body><main></main></body></html>", {
    url: "http://localhost:3000",
    pretendToBeVisual: true,
  });

  const previous = new Map<string, PropertyDescriptor | undefined>();

  for (const [name, value] of Object.entries({
    window: dom.window,
    self: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Element: dom.window.Element,
    HTMLButtonElement: dom.window.HTMLButtonElement,
    MutationObserver: dom.window.MutationObserver,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
    Node: dom.window.Node,
    CustomEvent: dom.window.CustomEvent,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }

  Object.defineProperty(dom.window, "matchMedia", {
    value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};

  const originalFetch = globalThis.fetch;

  const requestBodies: string[] = [];

  let resolvePendingResponse: (response: Response) => void = (_response) => {
    throw new Error("Assistant request did not start.");
  };

  globalThis.fetch = async (_input, init) => {
    requestBodies.push(String(init?.body));

    return new Promise<Response>((resolve) => {
      resolvePendingResponse = resolve;
    });
  };

  const container = dom.window.document.querySelector("main")!;

  const { createRoot } = await import("react-dom/client");

  const { FloatingPortfolioChat } =
    await import("@/app/_assistant/components/FloatingPortfolioChat");

  const root = createRoot(container);

  function button(label: string) {
    const found = Array.from(dom.window.document.querySelectorAll("button")).find(
      (element) =>
        element.textContent?.trim() === label || element.getAttribute("aria-label") === label,
    );

    assert.ok(found, `Missing ${label} button`);

    return found;
  }

  function surfaceIsOpen() {
    return Boolean(dom.window.document.querySelector("#portfolio-chat-input"));
  }

  try {
    await act(async () =>
      root.render(
        createElement(
          "div",
          null,
          createElement(
            "button",
            {
              onClick: (event) =>
                dispatchOpenPortfolioChat({
                  draft: { subject: "JPScents", text: "Why WhatsApp?" },
                  returnFocus: event.currentTarget,
                }),
            },
            "Why WhatsApp?",
          ),
          createElement(FloatingPortfolioChat),
        ),
      ),
    );
    await act(async () => button("Why WhatsApp?").click());
    assert.equal(dom.window.document.querySelector("textarea")?.value, "Why WhatsApp?");
    assert.match(dom.window.document.body.textContent ?? "", /About JPScents/);
    assert.deepEqual(requestBodies, []);

    await act(async () => button("Send message").click());
    assert.deepEqual(
      requestBodies.map((body) => JSON.parse(body)),
      [
        {
          message: "Context: JPScents\n\nWhy WhatsApp?",
          previousResponseId: null,
          workflowInstanceId: null,
        },
      ],
    );
    assert.equal(button("Close assistant").disabled, false);

    await act(async () => {
      button("Close assistant").click();
    });
    assert.equal(surfaceIsOpen(), false);

    resolvePendingResponse(doneResponse());
  } finally {
    await act(async () => {
      root.unmount();
    });
    globalThis.fetch = originalFetch;
    dom.window.close();

    for (const [name, descriptor] of previous) {
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, name);
      }
    }
  }
});
