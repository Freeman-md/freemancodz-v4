import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { AssistantChoice } from "@/app/_assistant/components/AssistantChoice";
import { useAssistant } from "@/app/_assistant/hooks/useAssistant";
import { ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY } from "@/app/_assistant/constants";

const choice = {
  question: "What next?",
  options: ["Continue my message", "Cancel my message and start an audit"],
};

const workflowId = "11111111-1111-4111-8111-111111111111";

const workflowEvent = {
  type: "workflow_instance",
  instance: {
    id: workflowId,
    workflowId: "meeting-booking",
    workflowVersion: 1,
    revision: 0,
    status: "active",
    progress: { phase: "collecting", fields: [], missingRequiredFields: [] },
  },
};

test("choices replace text entry, send exact ordinary replies once, and disappear on refresh or failure", async () => {
  const dom = new JSDOM("<main></main>", { url: "http://localhost:3000" });

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

  const originalFetch = globalThis.fetch;

  const requests: Array<Record<string, unknown>> = [];

  let response: unknown[] = [];

  let fail = false;

  let release: (() => void) | undefined;

  globalThis.fetch = async (_input, init) => {
    requests.push(JSON.parse(String(init?.body)));
    if (fail) {
      throw new Error("Network unavailable");
    }

    if (release) {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    }

    return new Response(response.map((event) => JSON.stringify(event)).join("\n") + "\n");
  };

  const { createRoot } = await import("react-dom/client");

  let root = createRoot(dom.window.document.querySelector("main")!);

  let assistant: ReturnType<typeof useAssistant> | undefined;

  function current() {
    assert.ok(assistant);

    return assistant;
  }

  function Harness() {
    assistant = useAssistant();

    return assistant.choice
      ? createElement(AssistantChoice, {
          choice: assistant.choice,
          isLoading: assistant.isLoading,
          onSend: assistant.submitMessage,
          onWriteReply: assistant.dismissChoice,
        })
      : createElement("textarea", { "aria-label": "Message" });
  }

  async function offer() {
    response = [
      workflowEvent,
      { type: "delta", delta: "Let's choose the next step." },
      { type: "response_id", responseId: "resp_ready" },
      { type: "choice", choice },
      { type: "done" },
    ];
    await act(async () => current().submitMessage("Help me choose"));
  }

  const form = () => dom.window.document.querySelector("form")!;

  const radios = () => [
    ...dom.window.document.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
  ];

  const send = () => dom.window.document.querySelector<HTMLButtonElement>('button[type="submit"]')!;

  try {
    await act(async () => root.render(createElement(Harness)));
    await offer();
    assert.equal(dom.window.document.querySelector("textarea"), null);
    assert.equal(radios().length, 2);
    assert.ok(radios().every((radio) => !radio.checked));
    assert.equal(send().disabled, true);
    assert.equal(dom.window.document.activeElement, radios()[0]);
    assert.equal(dom.window.document.querySelector("legend")?.textContent, choice.question);
    assert.deepEqual(
      current()
        .messages.filter((message) => message.role === "assistant")
        .map((message) => message.content),
      [""],
    );
    await act(async () => radios()[1]!.click());
    assert.equal(send().disabled, false);
    const before = requests.length;

    response = [{ type: "delta", delta: "Let's start the audit." }, { type: "done" }];
    release = () => undefined;
    const pendingForm = form();

    await act(async () => {
      pendingForm.dispatchEvent(
        new dom.window.Event("submit", { bubbles: true, cancelable: true }),
      );
      pendingForm.dispatchEvent(
        new dom.window.Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    assert.equal(requests.length, before + 1);
    assert.deepEqual(requests.at(-1), {
      message: choice.options[1],
      previousResponseId: "resp_ready",
      workflowInstanceId: workflowId,
    });
    assert.equal(current().choice, null);
    assert.ok(dom.window.document.querySelector("textarea"));
    await act(async () => {
      release?.();
    });
    release = undefined;
    assert.equal(
      current()
        .messages.filter((message) => message.role === "user")
        .at(-1)?.content,
      choice.options[1],
    );

    await offer();
    const beforeFallback = requests.length;

    await act(async () => {
      [...dom.window.document.querySelectorAll("button")]
        .find((button) => button.textContent === "Write my own reply")!
        .click();
    });
    assert.equal(requests.length, beforeFallback);
    assert.equal(current().workflowInstance?.id, workflowId);
    assert.ok(dom.window.document.querySelector("textarea"));

    await offer();
    await act(async () => root.unmount());
    root = createRoot(dom.window.document.querySelector("main")!);
    await act(async () => root.render(createElement(Harness)));
    assert.equal(current().choice, null);
    assert.equal(current().workflowInstance, null);
    assert.deepEqual(current().messages, []);
    assert.equal(dom.window.sessionStorage.length, 1);
    assert.equal(
      dom.window.sessionStorage.getItem(ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY),
      workflowId,
    );
    response = [{ type: "done" }];
    await act(async () => current().submitMessage("Resume"));
    assert.deepEqual(requests.at(-1), {
      message: "Resume",
      previousResponseId: null,
      workflowInstanceId: workflowId,
    });

    await offer();
    await act(async () => radios()[0]!.click());
    fail = true;
    const beforeFailure = requests.length;

    await act(async () => {
      form().dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    });
    assert.equal(requests.length, beforeFailure + 1);
    assert.equal(current().isLoading, false);
    assert.equal(current().choice, null);
    assert.equal(current().messages.at(-1)?.error, true);
    assert.ok(dom.window.document.querySelector("textarea"));
  } finally {
    await act(async () => root.unmount());
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
