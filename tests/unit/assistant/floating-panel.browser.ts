import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { AssistantTriggerButton } from "@/features/assistant/components/AssistantTriggerButton";
import { FloatingPortfolioChat } from "@/features/assistant/components/FloatingPortfolioChat";
import { dispatchOpenPortfolioChat } from "@/features/assistant/assistant.events";

function doneResponse() {
  return new Response(new ReadableStream({ start: (controller) => controller.close() }));
}

test("assistant surface opens without submitting and remains dismissible while a response is processing", async () => {
  const dom = new JSDOM("<!doctype html><html><body><main></main></body></html>", {
    url: "http://localhost:3000",
  });

  const previous = new Map<string, PropertyDescriptor | undefined>();

  for (const [name, value] of Object.entries({
    window: dom.window,
    self: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
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

  const root = createRoot(container);

  function button(label: string) {
    const found = Array.from(container.querySelectorAll("button")).find(
      (element) =>
        element.textContent?.trim() === label || element.getAttribute("aria-label") === label,
    );

    assert.ok(found, `Missing ${label} button`);

    return found;
  }

  function surfaceIsOpen() {
    return Boolean(container.querySelector("#portfolio-chat-input"));
  }

  try {
    await act(async () => {
      root.render(
        createElement(
          "div",
          null,
          createElement(AssistantTriggerButton, null, "Ask my assistant"),
          createElement(AssistantTriggerButton, null, "Ask your own question"),
          createElement(FloatingPortfolioChat),
        ),
      );
    });

    await act(async () => {
      button("Ask my assistant").click();
    });
    assert.equal(surfaceIsOpen(), true);
    assert.deepEqual(requestBodies, []);
    assert.equal(button("Send message").disabled, true);

    await act(async () => {
      button("Collapse portfolio chat").click();
    });
    assert.equal(surfaceIsOpen(), false);

    await act(async () => {
      button("Ask your own question").click();
    });
    assert.equal(surfaceIsOpen(), true);

    await act(async () => {
      button("Collapse portfolio chat").click();
      dispatchOpenPortfolioChat({ message: "Explicit audit intent" });
      await Promise.resolve();
    });
    assert.equal(surfaceIsOpen(), true);
    assert.deepEqual(requestBodies.map((body) => JSON.parse(body)), [
      {
        message: "Explicit audit intent",
        previousResponseId: null,
        workflowInstanceId: null,
      },
    ]);
    assert.equal(button("Collapse portfolio chat").disabled, false);

    await act(async () => {
      button("Collapse portfolio chat").click();
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
