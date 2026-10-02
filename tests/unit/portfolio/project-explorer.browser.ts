import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { PortfolioProjectExplorer } from "@/app/_portfolio/components/PortfolioWorkScene/PortfolioProjectExplorer";
import { StoryMotion } from "@/app/_portfolio/components/PortfolioStory/StoryMotion";

test("project navigation supports direct hashes, manual navigation and browser history", async () => {
  const dom = new JSDOM("<!doctype html><html><body><main></main></body></html>", {
    url: "http://localhost:3000/#debby-arts",
    pretendToBeVisual: true,
  });

  const previous = new Map<string, PropertyDescriptor | undefined>();

  for (const [name, value] of Object.entries({
    window: dom.window,
    self: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    HTMLDetailsElement: dom.window.HTMLDetailsElement,
    Node: dom.window.Node,
    IntersectionObserver: class {
      observe() {}

      unobserve() {}

      disconnect() {}
    },
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }

  const scrollDestinations: string[] = [];

  Object.defineProperty(dom.window, "matchMedia", {
    value: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
  });
  Object.defineProperty(dom.window, "requestAnimationFrame", {
    value: (callback: FrameRequestCallback) => {
      callback(0);

      return 1;
    },
  });

  dom.window.HTMLElement.prototype.scrollIntoView = function () {
    scrollDestinations.push(this.id);
  };

  const container = dom.window.document.querySelector("main")!;

  const { createRoot } = await import("react-dom/client");

  const root = createRoot(container);

  const panels = ["jpscents", "debby-arts", "pay4me-withradius"].map((slug) => ({
    slug,
    title: slug,
    content: createElement(
      "div",
      null,
      createElement("h3", { id: `${slug}-title` }, slug),
      createElement(
        "details",
        null,
        createElement("summary", null, "Inside the project"),
        "Project evidence",
      ),
    ),
  }));

  function visibleProject() {
    return container.querySelector("article:not([hidden])")?.id;
  }

  function navigationButton(label: string) {
    const button = container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);

    assert.ok(button);

    return button;
  }

  async function navigate(hash: string) {
    await act(async () => {
      dom.window.history.pushState(null, "", hash);
      dom.window.dispatchEvent(new dom.window.HashChangeEvent("hashchange"));
    });
  }

  try {
    await act(async () => {
      root.render(
        createElement(
          StoryMotion,
          null,
          createElement(PortfolioProjectExplorer, { panels }),
          createElement(
            "article",
            { id: "across-the-horizon" },
            createElement(
              "details",
              null,
              createElement("summary", null, "Additional project"),
              "Additional evidence",
            ),
          ),
        ),
      );
    });
    assert.equal(visibleProject(), "debby-arts");
    assert.equal(
      container.querySelector('a[aria-current="true"]')?.getAttribute("href"),
      "#debby-arts",
    );
    assert.deepEqual(scrollDestinations, ["selected-projects"]);
    assert.equal(container.querySelectorAll(".story-project-panels article").length, 3);
    assert.equal(container.querySelector<HTMLDetailsElement>("#debby-arts details")?.open, false);

    await act(async () => {
      navigationButton("Next project").click();
      dom.window.dispatchEvent(new dom.window.HashChangeEvent("hashchange"));
    });
    assert.equal(visibleProject(), "pay4me-withradius");
    assert.equal(navigationButton("Next project").disabled, true);

    await act(async () => {
      navigationButton("Previous project").click();
      dom.window.dispatchEvent(new dom.window.HashChangeEvent("hashchange"));
    });
    assert.equal(visibleProject(), "debby-arts");

    await navigate("#jpscents");
    assert.equal(visibleProject(), "jpscents");
    assert.equal(navigationButton("Previous project").disabled, true);

    await act(async () => {
      dom.window.history.replaceState(null, "", "#debby-arts");
      dom.window.dispatchEvent(new dom.window.PopStateEvent("popstate"));
    });
    assert.equal(visibleProject(), "debby-arts");
    await navigate("#about");
    assert.equal(visibleProject(), "jpscents");
    const scrollCount = scrollDestinations.length;

    await navigate("#jpscents");
    assert.equal(visibleProject(), "jpscents");
    assert.equal(scrollDestinations.length, scrollCount + 1);
    assert.equal(scrollDestinations.at(-1), "selected-projects");
    await navigate("#%E0%A4%A");
    assert.equal(visibleProject(), "jpscents");
    await navigate("#across-the-horizon");
    assert.equal(
      container.querySelector<HTMLDetailsElement>("#across-the-horizon details")?.open,
      true,
    );
    assert.equal(scrollDestinations.at(-1), "across-the-horizon");
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
