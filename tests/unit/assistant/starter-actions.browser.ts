import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement, useRef, useState } from "react";
import {
  AssistantMessages,
  type StarterAction,
} from "@/app/_assistant/components/AssistantMessages";

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

    const messagesEndRef = useRef<HTMLDivElement>(null);

    return createElement(AssistantMessages, {
      isLoading: loading,
      messages: hasMessages ? [{ id: "user", role: "user", content: "Question" }] : [],
      messagesEndRef,
      shouldReduceMotion: true,
      onStarterAction(action) {
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
      "What has Freeman built?",
      "How can Freeman help my business?",
      "Tell me about Freeman’s experience.",
    ];

    for (const action of expected) {
      await act(async () => root.render(createElement(Harness, { key: `action-${action}` })));
      assert.deepEqual(
        Array.from(container.querySelectorAll("button"), (element) => element.textContent?.trim()),
        expected,
      );
      await act(async () => button(action).click());
      assert.equal(container.querySelector('[aria-label="Start a conversation"]'), null);
    }

    assert.deepEqual(selected, expected);

    await act(async () => root.render(createElement(Harness, { loading: true, key: "loading" })));
    for (const element of container.querySelectorAll("button")) {
      assert.equal(element.disabled, true);
    }

    button(expected[0]).click();
    assert.equal(selected.length, 3);
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
