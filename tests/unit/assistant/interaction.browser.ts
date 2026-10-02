import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { AssistantInteraction } from "@/app/_assistant/components/AssistantInteraction";
import { AssistantMessages } from "@/app/_assistant/components/AssistantMessages";
import { AssistantComposer } from "@/app/_assistant/components/AssistantComposer";
import { useAssistant } from "@/app/_assistant/hooks/useAssistant";
import { useAssistantSurface } from "@/app/_assistant/hooks/useAssistantSurface";
import { ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY } from "@/app/_assistant/constants";
import type {
  AssistantInteraction as Interaction,
  AssistantInteractionReply,
  AssistantInteractionResult,
} from "@/contracts/assistant-ui.contract";

const interaction: Interaction = {
  id: "11111111-1111-4111-8111-111111111111",
  workflowInstanceId: "22222222-2222-4222-8222-222222222222",
  revision: 1,
  heading: "Details",
  controls: [
    {
      component: "InputField",
      field: "email",
      label: "Email",
      inputType: "email",
      options: null,
      required: true,
      maxLength: 320,
      value: "visitor@example.test",
    },
    {
      component: "TextArea",
      field: "message",
      label: "Message (optional)",
      inputType: null,
      options: null,
      required: false,
      maxLength: 4000,
      value: "Long answer",
    },
  ],
};

test("shared controls retain values on errors, group one submit and disable accepted or uncertain answers", async () => {
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

  const { createRoot } = await import("react-dom/client");

  const root = createRoot(dom.window.document.querySelector("main")!);

  const replies: AssistantInteractionReply[] = [];

  const changes: Array<{ interactionId: string; field: string; value: string }> = [];

  const render = async (result?: AssistantInteractionResult, uncertain?: boolean) =>
    act(async () =>
      root.render(
        createElement(AssistantInteraction, {
          interaction,
          values: { email: "visitor@example.test", message: "Long answer" },
          result,
          uncertain,
          isLoading: false,
          onSubmit: async (reply) => {
            replies.push(reply);
          },
          onValueChange(interactionId, field, value) {
            changes.push({ interactionId, field, value });
          },
        }),
      ),
    );

  try {
    await render();
    const document = dom.window.document;

    assert.equal(document.querySelectorAll('button[type="submit"]').length, 1);
    assert.equal(
      document.querySelector('label[for$="-message"]')?.textContent,
      "Message (optional)",
    );
    assert.equal(document.querySelector('input[type="email"]')?.getAttribute("maxlength"), "320");
    const input = document.querySelector("input")!;

    input.focus();
    assert.equal(document.activeElement, input);
    await act(async () => {
      document
        .querySelector("form")!
        .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    });
    assert.deepEqual(replies[0].values, { email: "visitor@example.test", message: "Long answer" });
    await render({
      interactionId: interaction.id,
      status: "invalid",
      fieldErrors: { email: "Correct your email." },
    });
    assert.equal(input.value, "visitor@example.test");
    assert.equal(document.querySelector("textarea")?.value, "Long answer");
    assert.equal(input.getAttribute("aria-invalid"), "true");
    assert.match(document.querySelector('[role="alert"]')?.textContent ?? "", /Correct your email/);
    assert.equal(input.disabled, false);
    await render({ interactionId: interaction.id, status: "accepted", summary: "Saved" });
    assert.equal(input.disabled, true);
    await act(async () => {
      document
        .querySelector("form")!
        .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    });
    assert.equal(replies.length, 1);
    await render(undefined, true);
    assert.match(document.querySelector('[role="status"]')?.textContent ?? "", /will not retry/);
    assert.equal(input.disabled, true);
    const choice: Interaction = {
      ...interaction,
      id: "33333333-3333-4333-8333-333333333333",
      controls: [
        {
          component: "OptionSelector",
          field: "constructor",
          label: "Next step",
          inputType: null,
          options: [
            { value: "continue", label: "Continue" },
            { value: "switch", label: "Switch" },
          ],
          required: true,
          maxLength: 8,
          value: "continue",
        },
      ],
    };

    await act(async () =>
      root.render(
        createElement(AssistantInteraction, {
          key: choice.id,
          interaction: choice,
          values: {},
          isLoading: false,
          onSubmit: async (reply) => {
            replies.push(reply);
          },
          onValueChange(interactionId, field, value) {
            changes.push({ interactionId, field, value });
          },
        }),
      ),
    );
    assert.equal(document.querySelector("select")?.value, "continue");
    assert.equal(document.querySelector("select")?.getAttribute("aria-invalid"), "false");
    assert.equal(document.querySelector('[role="alert"]'), null);
    assert.equal(document.querySelector("label")?.htmlFor, document.querySelector("select")?.id);
    await act(async () => {
      const select = document.querySelector("select")!;

      select.value = "switch";
      select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    });
    assert.deepEqual(changes, [{ interactionId: choice.id, field: "constructor", value: "switch" }]);
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

test("structured replies retain drafts across remounts and errors, show accepted summaries and restore only the workflow ID", async () => {
  const dom = new JSDOM("<main></main>", { url: "http://localhost:3000" });

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

  const originalFetch = globalThis.fetch;

  Object.defineProperty(dom.window, "matchMedia", {
    value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  });
  let scrollCount = 0;

  dom.window.HTMLElement.prototype.scrollIntoView = () => {
    scrollCount += 1;
  };

  const responses: Array<unknown[]> = [];

  const requests: unknown[] = [];

  globalThis.fetch = async (_input, init) => {
    requests.push(JSON.parse(String(init?.body)));
    const events = responses.shift();

    if (!events) {
      throw new Error("Network failed");
    }

    return new Response(events.map((event) => JSON.stringify(event)).join("\n") + "\n");
  };

  const { createRoot } = await import("react-dom/client");

  let root = createRoot(dom.window.document.querySelector("main")!);

  let assistant: ReturnType<typeof useAssistant> | undefined;

  let assistantSurface: ReturnType<typeof useAssistantSurface> | undefined;

  function Harness({ surface = "compact" }: { surface?: string | null }) {
    assistant = useAssistant();
    assistantSurface = useAssistantSurface({
      isLoading: assistant.isLoading,
      messages: assistant.messages,
      shouldReduceMotion: true,
      submitMessage: assistant.submitMessage,
    });

    return surface
      ? createElement(
          "div",
          { key: surface },
          createElement(AssistantMessages, {
            messages: assistant.messages,
            isLoading: assistant.isLoading,
            messagesEndRef: assistantSurface.messagesEndRef,
            shouldReduceMotion: true,
            onStarterAction() {},
            onInteractionSubmit: assistant.submitInteraction,
            onInteractionValueChange: assistant.updateInteractionValue,
          }),
          createElement(AssistantComposer, {
            canSubmit: assistant.canSubmit,
            input: assistant.input,
            onInputChange: assistant.setInput,
            textareaRef: assistantSurface.textareaRef,
            onSubmit: async () => {
              if (assistant!.canSubmit) {
                await assistant!.submitMessage(assistant!.input);
              }
            },
          }),
        )
      : null;
  }

  const reply = {
    interactionId: interaction.id,
    revision: interaction.revision,
    values: { email: "visitor@example.test", message: "Long answer" },
  };

  try {
    await act(async () => root.render(createElement(Harness)));
    await act(async () => assistantSurface!.openChat());
    const initialScrollCount = scrollCount;

    responses.push([
      {
        type: "workflow_instance",
        instance: {
          id: interaction.workflowInstanceId,
          workflowId: "contact",
          workflowVersion: 1,
          status: "active",
          progress: { phase: "collecting", fields: [], missingRequiredFields: [] },
        },
      },
      { type: "interaction", interaction },
      { type: "done" },
    ]);
    await act(async () => assistant!.submitMessage("Use inputs"));
    assert.ok(scrollCount > initialScrollCount, "A new assistant interaction scrolls into view");
    const scrollCountBeforeEditing = scrollCount;

    await act(async () =>
      assistant!.updateInteractionValue(interaction.id, "message", "Edited draft answer"),
    );
    const originalTextarea = dom.window.document.querySelector("textarea");

    assert.equal(originalTextarea?.value, "Edited draft answer");
    assert.equal(scrollCount, scrollCountBeforeEditing, "Editing a draft must not move the scroll position");
    await act(async () => root.render(createElement(Harness, { surface: "expanded" })));
    assert.notEqual(dom.window.document.querySelector("textarea"), originalTextarea);
    assert.equal(dom.window.document.querySelector("textarea")?.value, "Edited draft answer");
    responses.push([
      {
        type: "interaction_result",
        result: {
          interactionId: interaction.id,
          status: "invalid",
          fieldErrors: { email: "Invalid email" },
        },
      },
      { type: "done" },
    ]);
    await act(async () => {
      dom.window.document
        .querySelector("form")!
        .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    });
    assert.deepEqual(
      (requests.at(-1) as { interactionReply: AssistantInteractionReply }).interactionReply.values,
      { email: "visitor@example.test", message: "Edited draft answer" },
    );
    assert.equal(
      assistant!.messages.find((item) => item.interaction)?.interactionResult?.status,
      "invalid",
    );
    await act(async () => root.render(createElement(Harness, { surface: null })));
    assert.equal(dom.window.document.querySelector("textarea"), null);
    await act(async () => root.render(createElement(Harness, { surface: "reopened" })));
    assert.equal(dom.window.document.querySelector("textarea")?.value, "Edited draft answer");
    assert.equal(dom.window.document.querySelector("textarea")?.disabled, false);
    assert.match(dom.window.document.querySelector('[role="alert"]')?.textContent ?? "", /Invalid email/);
    responses.push([
      {
        type: "interaction_result",
        result: {
          interactionId: interaction.id,
          status: "accepted",
          summary: "Email: visitor@example.test",
        },
      },
      { type: "done" },
    ]);
    await act(async () => assistant!.submitInteraction(reply));
    assert.ok(
      assistant!.messages.some(
        (item) => item.role === "user" && item.content === "Email: visitor@example.test",
      ),
    );
    await act(async () => assistant!.submitInteraction(reply));
    assert.equal(requests.length, 3, "Accepted replies cannot be resubmitted");
    const fresh = { ...interaction, id: "44444444-4444-4444-8444-444444444444", revision: 2 };

    responses.push([{ type: "interaction", interaction: fresh }, { type: "done" }]);
    await act(async () => assistant!.submitMessage("Collect another answer"));
    const freshReply = { ...reply, interactionId: fresh.id, revision: fresh.revision };

    await act(async () => assistant!.submitInteraction(freshReply));
    assert.equal(
      assistant!.messages.find((item) => item.interaction?.id === fresh.id)?.interactionUncertain,
      true,
    );
    assert.equal(requests.length, 5, "Network failure must not retry automatically");
    await act(async () => assistant!.submitInteraction(freshReply));
    assert.equal(requests.length, 5, "Uncertain replies require a fresh conversation, not retry");
    assert.deepEqual(Object.keys(dom.window.sessionStorage), [
      ACTIVE_WORKFLOW_INSTANCE_STORAGE_KEY,
    ]);
    const conversation = {
      ...interaction,
      id: "55555555-5555-4555-8555-555555555555",
      workflowInstanceId: null,
      revision: 0,
    };

    const introduction = "I can help with that. Which details would you like me to use?";

    responses.push([
      { type: "delta", delta: introduction },
      { type: "interaction", interaction: conversation },
      { type: "done" },
    ]);
    const workflowStart = {
      workflowId: "contact",
      originPage: "/",
      originEntry: "assistant-starter-contact",
    } as const;

    await act(async () => assistant!.submitMessage("Start a contact request", workflowStart));
    assert.deepEqual(
      requests.at(-1),
      {
        message: "Start a contact request",
        workflowStart,
        previousResponseId: null,
        workflowInstanceId: interaction.workflowInstanceId,
      },
      "A workflow starter is a separate intent, not an answer to pending controls",
    );
    responses.push([
      {
        type: "interaction_result",
        result: {
          interactionId: conversation.id,
          status: "accepted",
          summary: "Email: visitor@example.test\nMessage: Long answer",
        },
      },
      { type: "delta", delta: "A separate assistant response." },
      { type: "done" },
    ]);
    const conversationReply = { ...reply, interactionId: conversation.id, revision: 0 };

    await act(async () => {
      await Promise.all([
        assistant!.submitInteraction(conversationReply),
        assistant!.submitInteraction(conversationReply),
      ]);
    });
    assert.equal(requests.length, 7, "Concurrent form submissions send one request");
    assert.deepEqual(
      (requests.at(-1) as { interactionReply: AssistantInteractionReply }).interactionReply
        .interaction,
      { ...conversation, question: introduction },
    );
    assert.deepEqual(
      assistant!.messages.slice(-2).map(({ role, content }) => ({ role, content })),
      [
        { role: "user", content: "Email: visitor@example.test\nMessage: Long answer" },
        { role: "assistant", content: "A separate assistant response." },
      ],
    );
    assert.equal(
      assistant!.messages.find((message) => message.interaction?.id === conversation.id)?.content,
      introduction,
      "The introduction stays with the assistant's controls, not the visitor's answer",
    );
    await act(async () => assistant!.submitInteraction(conversationReply));
    assert.equal(requests.length, 7, "Accepted conversational replies cannot be resubmitted");

    const pending: Interaction = {
      ...conversation,
      id: "66666666-6666-4666-8666-666666666666",
      heading: "Project priorities",
      controls: [
        {
          component: "OptionSelector",
          field: "priority",
          label: "Priority",
          inputType: null,
          options: [
            { value: "performance", label: "Performance" },
            { value: "accessibility", label: "Accessibility" },
          ],
          required: true,
          maxLength: 100,
          value: "",
        },
      ],
    };

    responses.push([
      { type: "delta", delta: "Let's compare the options. What matters most for this project?" },
      { type: "interaction", interaction: pending },
      { type: "done" },
    ]);
    await act(async () => assistant!.submitMessage("Help me choose a project priority"));
    const pendingForm = dom.window.document.querySelector("select")!.closest("form")!;

    assert.equal(pendingForm.checkValidity(), false, "The optional presentation is unanswered");
    const normalAnswer = "Performance, please — and explain the trade-offs.";

    await act(async () => assistant!.setInput(normalAnswer));
    const sendButton = dom.window.document.querySelector<HTMLButtonElement>(
      'button[aria-label="Send message"]',
    )!;

    assert.equal(sendButton.disabled, false, "Pending required controls must not block the composer");
    responses.push([
      { type: "delta", delta: "Here are the performance trade-offs." },
      { type: "done" },
    ]);
    await act(async () => sendButton.click());
    assert.deepEqual(requests.at(-1), {
      message: normalAnswer,
      interactionContext: {
        ...pending,
        question: "Let's compare the options. What matters most for this project?",
      },
      previousResponseId: null,
      workflowInstanceId: interaction.workflowInstanceId,
    });
    assert.deepEqual(
      assistant!.messages.find((message) => message.interaction?.id === pending.id)?.interactionResult,
      { interactionId: pending.id, status: "stale" },
    );
    assert.equal(pendingForm.querySelector("select")?.disabled, true);
    assert.equal(pendingForm.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled, true);
    assert.deepEqual(
      assistant!.messages.slice(-2).map(({ role, content }) => ({ role, content })),
      [
        { role: "user", content: normalAnswer },
        { role: "assistant", content: "Here are the performance trade-offs." },
      ],
    );
    await act(async () => {
      pendingForm.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
      await assistant!.submitInteraction({
        interactionId: pending.id,
        revision: pending.revision,
        values: { priority: "performance" },
      });
    });
    assert.equal(requests.length, 9, "Bypassed controls cannot send a later structured reply");
    await act(async () => root.unmount());
    const container = dom.window.document.createElement("main");

    dom.window.document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(createElement(Harness)));
    assert.deepEqual(assistant!.messages, []);
    assert.equal(assistant!.workflowInstance, null);
    await act(async () => assistant!.submitMessage("Continue"));
    assert.equal(
      (requests.at(-1) as { workflowInstanceId: string }).workflowInstanceId,
      interaction.workflowInstanceId,
    );
    assert.equal(requests.length, 10);
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
