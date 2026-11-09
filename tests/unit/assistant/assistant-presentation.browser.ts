import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement, createRef } from "react";
import { AssistantMessages } from "@/app/_assistant/components/AssistantMessages";
import { AssistantWorkflowProgress } from "@/app/_assistant/components/AssistantWorkflowProgress";
import { AssistantSources } from "@/app/_assistant/components/AssistantSources";
import { AssistantWorkflowConfirmation } from "@/app/_assistant/components/AssistantWorkflowConfirmation";
import type { AssistantWorkflowAction } from "@/contracts/assistant.contract";
import type { WorkflowPublicInstance } from "@/contracts/assistant.contract";

test("booking review submits the displayed revision and replaces obsolete controls", async () => {
  await withBrowser(async ({ container, root }) => {
    const instance: WorkflowPublicInstance = {
      ...workflowInstance("00000000-0000-4000-8000-000000000001", "visitor@example.com"),
      workflowId: "meeting-booking",
      revision: 7,
      confirmationAction: "confirm",
      progress: {
        phase: "awaiting_confirmation",
        missingRequiredFields: [],
        fields: [
          { key: "name", required: true, value: "Visitor" },
          { key: "email", required: true, value: "visitor@example.com" },
          { key: "reason", required: true, value: "Discuss a project" },
          {
            key: "selectedSlot",
            required: true,
            value: {
              start: "2099-09-15T11:00:00.000Z",
              end: "2099-09-15T11:30:00.000Z",
              timezone: "Europe/London",
            },
          },
        ],
      },
    };

    const actions: AssistantWorkflowAction[] = [];

    const render = async (snapshot: WorkflowPublicInstance, isLoading = false) => {
      await act(async () =>
        root.render(
          createElement(AssistantWorkflowConfirmation, {
            instance: snapshot,
            isLoading,
            onSubmit: async (action) => {
              actions.push(action);
            },
          }),
        ),
      );
    };

    await render(instance);
    assert.match(container.textContent ?? "", /visitor@example.com/);
    assert.match(container.textContent ?? "", /2099/);
    assert.match(container.textContent ?? "", /London/);
    assert.equal(container.querySelector("input,textarea,select"), null);
    await act(async () => container.querySelector("button")!.click());
    assert.deepEqual(actions, [
      { action: "confirm_booking", workflowInstanceId: instance.id, expectedRevision: 7 },
    ]);
    await render({ ...instance, revision: 8 });
    await act(async () => container.querySelector("button")!.click());
    assert.equal("expectedRevision" in actions[1] && actions[1].expectedRevision, 8);
    await render({ ...instance, revision: 9, confirmationAction: "retry" }, true);
    assert.equal(container.querySelector("button")!.disabled, true);
    await act(async () => container.querySelector("button")!.click());
    assert.equal(actions.length, 2);
    await render({ ...instance, revision: 9, confirmationAction: "retry" });
    assert.match(container.textContent ?? "", /Retry booking/);
    await act(async () => container.querySelector("button")!.click());
    assert.deepEqual(actions[2], { action: "retry_booking", workflowInstanceId: instance.id });
    await render({ ...instance, status: "completed", confirmationAction: undefined });
    assert.equal(container.querySelector("button"), null);
  });
});

test("contact reviews submit the displayed snapshot and expose explicit retry", async () => {
  for (const workflowId of ["contact"] as const) {
    await withBrowser(async ({ container, root }) => {
      const actions: AssistantWorkflowAction[] = [];

      const instance: WorkflowPublicInstance = {
        ...workflowInstance("00000000-0000-4000-8000-000000000001", "visitor@example.com"),
        workflowId,
        revision: 4,
        confirmationAction: "confirm",
      };

      const render = async (snapshot: WorkflowPublicInstance, isLoading = false) => {
        await act(async () =>
          root.render(
            createElement(AssistantWorkflowConfirmation, {
              instance: snapshot,
              isLoading,
              onSubmit: async (action) => {
                actions.push(action);
              },
            }),
          ),
        );
      };

      await render(instance);
      assert.equal(container.querySelector("input,textarea,select"), null);
      assert.match(container.querySelector("button")!.textContent!, /Send message/);
      await act(async () => container.querySelector("button")!.click());
      assert.deepEqual(actions[0], {
        action: `confirm_${workflowId}`,
        workflowInstanceId: instance.id,
        expectedRevision: 4,
      });
      await render({ ...instance, revision: 5 });
      await act(async () => container.querySelector("button")!.click());
      assert.equal("expectedRevision" in actions[1] && actions[1].expectedRevision, 5);
      await render({ ...instance, confirmationAction: "retry" }, true);
      await act(async () => container.querySelector("button")!.click());
      assert.equal(actions.length, 2);
      await render({ ...instance, confirmationAction: "retry" });
      await act(async () => container.querySelector("button")!.click());
      assert.deepEqual(actions[2], {
        action: `retry_${workflowId}`,
        workflowInstanceId: instance.id,
      });
      await render({ ...instance, status: "completed", confirmationAction: undefined });
      assert.equal(container.querySelector("button"), null);
    });
  }
});

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
                { id: "internal", title: "Selected work", url: "/work/jpscents" },
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

    assert.match(container.textContent ?? "", /Related portfolio sources · 1/);
    assert.match(container.textContent ?? "", /Selected work/);
    assert.match(container.textContent ?? "", /\/work\/jpscents/);
    assert.equal(container.querySelector('a[href="/work/jpscents"]')?.getAttribute("target"), null);
    assert.equal(
      container.querySelector('a[href="https://example.com/reference"]')?.getAttribute("target"),
      undefined,
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

    assert.doesNotMatch(container.textContent ?? "", /Related portfolio sources/);
  });
});

test("sources keep four portfolio destinations, deduplicate and preserve modified clicks", async () => {
  await withBrowser(async ({ container, root }) => {
    const destinations = ["/work/jpscents", "/#experience", "/#services", "/#top"];

    const followed: string[] = [];

    await act(async () => {
      root.render(
        createElement(AssistantSources, {
          sources: [
            ...destinations.map((url) => ({ id: url, title: url, url })),
            { id: "same", title: "Different title", url: destinations[0] },
            { id: "retired", title: "Retired", url: "/#jpscents" },
            { id: "external", title: "External", url: "https://example.com" },
          ],
          onInternalSource: (href) => followed.push(href),
        }),
      );
    });
    const links = Array.from(container.querySelectorAll("a"));

    assert.deepEqual(
      links.map((link) => link.getAttribute("href")),
      destinations,
    );
    assert.match(container.textContent ?? "", /Related portfolio sources · 4/);
    const MouseEvent = container.ownerDocument.defaultView!.MouseEvent;

    const modified = new MouseEvent("click", { bubbles: true, cancelable: true, metaKey: true });

    links[0].dispatchEvent(modified);
    assert.equal(modified.defaultPrevented, false);
    assert.deepEqual(followed, []);
    links[0].click();
    assert.deepEqual(followed, [destinations[0]]);
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
    revision: 0,
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
    pretendToBeVisual: true,
  });

  const previous = new Map<string, PropertyDescriptor | undefined>();

  for (const [name, value] of Object.entries({
    window: dom.window,
    self: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    HTMLDetailsElement: dom.window.HTMLDetailsElement,
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

  dom.window.HTMLElement.prototype.scrollIntoView = () => {};

  Object.defineProperty(dom.window, "matchMedia", {
    value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  });

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
