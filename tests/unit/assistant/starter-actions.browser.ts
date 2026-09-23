import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement, useState } from "react";
import { StarterActions, type StarterAction } from "@/features/assistant/components/StarterActions";

test("shared starter actions dispatch exact starts, disappear after conversation begins, and disable while loading", async () => {
  const dom = new JSDOM("<!doctype html><html><body><main></main></body></html>");

  const previous = new Map<string, PropertyDescriptor | undefined>();

  for (const [name, value] of Object.entries({
    window: dom.window,
    self: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }

  const selected: StarterAction[] = [];

  const container = dom.window.document.querySelector("main")!;

  const { createRoot } = await import("react-dom/client");

  const root = createRoot(container);

  function Harness({ loading = false }: { loading?: boolean }) {
    const [hasMessages, setHasMessages] = useState(false);

    return hasMessages
      ? createElement("output", null, "conversation")
      : createElement(StarterActions, {
          disabled: loading,
          onSelect(action) {
            selected.push(action);
            setHasMessages(true);
          },
        });
  }

  function button(label: string) {
    const found = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent?.trim() === label,
    );

    assert.ok(found, `Missing ${label} button`);

    return found;
  }

  try {
    const expected: StarterAction[] = [
      {
        label: "Ask about my work",
        message: "Tell me about Freeman's work.",
        workflowStart: null,
      },
      {
        label: "Request a free audit",
        message: "I'd like to request a free audit.",
        workflowStart: {
          workflowId: "audit",
          originPage: "/",
          originEntry: "assistant-starter-audit",
        },
      },
      {
        label: "Book a meeting",
        message: "I'd like to book a meeting with Freeman.",
        workflowStart: {
          workflowId: "meeting-booking",
          originPage: "/",
          originEntry: "assistant-starter-meeting",
        },
      },
      {
        label: "Leave a message",
        message: "I'd like to leave Freeman a message.",
        workflowStart: {
          workflowId: "contact",
          originPage: "/",
          originEntry: "assistant-starter-contact",
        },
      },
    ];

    for (const action of expected) {
      await act(async () => root.render(createElement(Harness, { key: `action-${action.label}` })));
      assert.deepEqual(
        Array.from(container.querySelectorAll("button"), (element) => element.textContent?.trim()),
        expected.map(({ label }) => label),
      );
      await act(async () => button(action.label).click());
      assert.equal(container.textContent, "conversation");
    }

    assert.deepEqual(selected, expected);

    await act(async () => root.render(createElement(Harness, { loading: true, key: "loading" })));
    for (const element of container.querySelectorAll("button")) {
      assert.equal(element.disabled, true);
    }

    button("Leave a message").click();
    assert.equal(selected.length, 4);
  } finally {
    await act(async () => root.unmount());
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
