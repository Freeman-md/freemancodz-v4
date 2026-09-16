import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { Navbar } from "@/shared/components/layout/Navbar";
import { HomeRelevantWorkSection } from "@/features/portfolio/components/HomeRelevantWorkSection";
import { ChatComposer } from "@/features/assistant/components/ChatComposer";
import { dispatchOpenPortfolioChat } from "@/features/assistant/assistant.events";
import { useFloatingPanel } from "@/features/assistant/hooks/useFloatingPanel";

test("generic assistant entry opens without submitting, and pending responses remain dismissible", async () => {
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
  const submitted: string[] = [];

  const container = dom.window.document.querySelector("main")!;

  const { createRoot } = await import("react-dom/client");

  const root = createRoot(container);

  const project = {
    slug: "project",
    title: "Project",
    category: "Test",
    problem: "Problem",
    solution: "Solution",
    outcome: null,
    externalLinks: [],
    visualBlock: null,
    visualText: null,
    cover: null,
  };

  function Panel({ isLoading }: { isLoading: boolean }) {
    const panel = useFloatingPanel({
      clearError() {},
      isLoading,
      messages: [],
      async submitMessage(message) {
        submitted.push(message);
      },
    });

    return createElement(
      "div",
      { ref: panel.shellRef },
      createElement("output", { "aria-label": "Panel state" }, panel.stage),
      panel.isOpen
        ? createElement(ChatComposer, {
            canSubmit: false,
            errorMessage: null,
            input: "",
            textareaRef: panel.textareaRef,
            onInputChange() {},
            onKeyDown() {},
            onSubmit() {},
            onClose: panel.closeChat,
          })
        : null,
    );
  }

  const render = (isLoading: boolean) =>
    createElement(
      PathnameContext.Provider,
      { value: "/" },
      createElement(Navbar, { linkedInUrl: "https://example.com/profile" }),
      createElement(HomeRelevantWorkSection, {
        projects: {
          pay4Me: { ...project, title: "Pay4Me" },
          portfolioAssistant: { ...project, title: "Portfolio Assistant" },
          emailPa: { ...project, title: "Email PA" },
        },
        relevantWork: {
          eyebrow: "Proof",
          title: "Relevant work",
          copy: "Project evidence",
          icons: [],
          media: [],
          actions: [],
        },
      }),
      createElement(Panel, { isLoading }),
    );

  function button(label: string) {
    const found = Array.from(container.querySelectorAll("button")).find(
      (element) =>
        element.textContent?.trim() === label || element.getAttribute("aria-label") === label,
    );

    assert.ok(found, `Missing ${label} button`);

    return found;
  }

  const state = () => container.querySelector("output")?.textContent;

  try {
    await act(async () => {
      root.render(render(false));
    });
    await act(async () => {
      button("Assistant").click();
    });
    assert.equal(state(), "composer");
    assert.deepEqual(submitted, []);
    assert.equal(button("Send message").disabled, true);
    await act(async () => {
      button("Collapse portfolio chat").click();
    });
    assert.equal(state(), "launcher");
    await act(async () => {
      button("Try the assistant").click();
    });
    assert.equal(state(), "composer");
    assert.deepEqual(submitted, []);

    await act(async () => {
      root.render(render(true));
    });
    assert.equal(button("Collapse portfolio chat").disabled, false);
    await act(async () => {
      button("Collapse portfolio chat").click();
    });
    assert.equal(state(), "launcher");
    await act(async () => {
      dispatchOpenPortfolioChat();
    });
    await act(async () => {
      dom.window.document.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape" }));
    });
    assert.equal(state(), "launcher");
    await act(async () => {
      dispatchOpenPortfolioChat();
    });
    await act(async () => {
      dom.window.document.body.dispatchEvent(
        new dom.window.Event("pointerdown", { bubbles: true }),
      );
    });
    assert.equal(state(), "launcher");

    await act(async () => {
      root.render(render(false));
      dispatchOpenPortfolioChat({ message: "Explicit audit intent" });
    });
    assert.equal(state(), "conversation");
    assert.deepEqual(submitted, ["Explicit audit intent"]);
  } finally {
    await act(async () => {
      root.unmount();
    });
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
