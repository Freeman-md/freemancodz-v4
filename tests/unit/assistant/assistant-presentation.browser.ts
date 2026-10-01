import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement, createRef } from "react";
import { AssistantMessages } from "@/app/_assistant/components/AssistantMessages";
import { AssistantWorkflowProgress } from "@/app/_assistant/components/AssistantWorkflowProgress";
import type { WorkflowPublicInstance } from "@/contracts/assistant.contract";

test("sources belong to their answer and disappear when no evidence is returned", async () => {
  await withBrowser(async ({ container, root }) => {
    const messagesEndRef = createRef<HTMLDivElement>();

    await act(async () => {
      root.render(
        createElement(AssistantMessages, {
          isLoading: false,
          messages: [
            {
              id: "answer",
              role: "assistant",
              content: "Here is the relevant work.",
              sources: [
                { id: "internal", title: "Selected work", url: "/work" },
                {
                  id: "external",
                  title: "External reference",
                  url: "https://example.com/reference",
                },
              ],
            },
          ],
          messagesEndRef,
          shouldReduceMotion: true,
          onStarterAction() {},
        }),
      );
    });

    assert.match(container.textContent ?? "", /Sources · 2/);
    assert.match(container.textContent ?? "", /Selected work/);
    assert.match(container.textContent ?? "", /\/work/);
    assert.equal(container.querySelector('a[href="/work"]')?.getAttribute("target"), null);
    assert.equal(
      container.querySelector('a[href="https://example.com/reference"]')?.getAttribute("target"),
      "_blank",
    );

    await act(async () => {
      root.render(
        createElement(AssistantMessages, {
          isLoading: false,
          messages: [{ id: "answer", role: "assistant", content: "No sources.", sources: [] }],
          messagesEndRef,
          shouldReduceMotion: true,
          onStarterAction() {},
        }),
      );
    });

    assert.doesNotMatch(container.textContent ?? "", /Sources ·/);
  });
});

test("workflow progress is read-only, starts collapsed, and only resets for a new instance", async () => {
  await withBrowser(async ({ container, root }) => {
    const firstInstance = workflowInstance("00000000-0000-4000-8000-000000000001", null);

    await act(async () => {
      root.render(
        createElement(AssistantWorkflowProgress, {
          key: firstInstance.id,
          instance: firstInstance,
        }),
      );
    });

    const trigger = container.querySelector("button");

    assert.ok(trigger);
    assert.equal(trigger.getAttribute("aria-expanded"), "false");
    assert.match(container.textContent ?? "", /Leave a message/);
    assert.match(container.textContent ?? "", /1 of 3 details/);
    assert.equal(container.querySelector("input, textarea, select"), null);

    await act(async () => trigger.click());
    assert.equal(trigger.getAttribute("aria-expanded"), "true");
    assert.match(container.textContent ?? "", /Not provided/);

    await act(async () => {
      root.render(
        createElement(AssistantWorkflowProgress, {
          key: firstInstance.id,
          instance: workflowInstance(firstInstance.id, "james@example.com"),
        }),
      );
    });
    assert.equal(container.querySelector("button")?.getAttribute("aria-expanded"), "true");
    assert.match(container.textContent ?? "", /2 of 3 details/);

    await act(async () => {
      root.render(
        createElement(AssistantWorkflowProgress, {
          key: "00000000-0000-4000-8000-000000000002",
          instance: workflowInstance("00000000-0000-4000-8000-000000000002", null),
        }),
      );
    });
    assert.equal(container.querySelector("button")?.getAttribute("aria-expanded"), "false");
  });
});

function workflowInstance(id: string, email: string | null): WorkflowPublicInstance {
  return {
    id,
    workflowId: "contact",
    workflowVersion: 1,
    status: "active",
    progress: {
      phase: "collecting",
      fields: [
        { key: "name", required: true, value: "James" },
        { key: "email", required: true, value: email },
        { key: "message", required: true, value: null },
        { key: "businessName", required: false, value: null },
      ],
      missingRequiredFields: email ? ["message"] : ["email", "message"],
    },
  };
}

async function withBrowser(
  run: (context: {
    container: HTMLElement;
    root: ReturnType<(typeof import("react-dom/client"))["createRoot"]>;
  }) => Promise<void>,
) {
  const dom = new JSDOM("<!doctype html><html><body><main></main></body></html>", {
    url: "http://localhost:3000",
  });

  const previous = new Map<string, PropertyDescriptor | undefined>();

  for (const [name, value] of Object.entries({
    window: dom.window,
    self: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Element: dom.window.Element,
    Node: dom.window.Node,
    MutationObserver: dom.window.MutationObserver,
    getComputedStyle: dom.window.getComputedStyle,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }

  const container = dom.window.document.querySelector("main")!;

  const { createRoot } = await import("react-dom/client");

  const root = createRoot(container);

  try {
    await run({ container, root });
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
}
