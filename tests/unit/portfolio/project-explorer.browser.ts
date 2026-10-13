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

  const mediaListeners = new Set<() => void>();

  let reduceMotion = true;

  Object.defineProperty(dom.window, "matchMedia", {
    value: (query: string) => ({
      get matches() {
        return query.includes("reduced-motion") ? reduceMotion : true;
      },
      addEventListener(_type: string, listener: () => void) {
        mediaListeners.add(listener);
      },
      removeEventListener(_type: string, listener: () => void) {
        mediaListeners.delete(listener);
      },
    }),
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
    return container
      .querySelector(".story-project-panels article:not([hidden])")
      ?.getAttribute("data-project-slug");
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
    for (const { slug } of panels) {
      const anchor = container.querySelector(`#${slug}`);

      assert.ok(anchor);
      assert.equal(anchor.parentElement?.id, "selected-projects");
      assert.equal(anchor.closest("[hidden]"), null);
      assert.equal(container.querySelectorAll(`#${slug}`).length, 1);
    }

    assert.equal(
      container.querySelector<HTMLDetailsElement>('[data-project-slug="debby-arts"] details')?.open,
      false,
    );

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

    const gallery = container.querySelector<HTMLElement>(".story-project-explorer")!;

    const track = container.querySelector<HTMLElement>(".story-project-panels")!;

    Object.defineProperty(gallery, "clientWidth", { value: 1200 });
    Object.defineProperty(track, "scrollWidth", { value: 3728 });
    gallery.getBoundingClientRect = () => ({
      top: 1800 - dom.window.scrollY,
      bottom: 4400 - dom.window.scrollY,
      height: 2600,
      width: 1200,
      left: 0,
      right: 1200,
      x: 0,
      y: 0,
      toJSON() {},
    });
    dom.window.scrollTo = ((options: ScrollToOptions) => {
      Object.defineProperty(dom.window, "scrollY", { configurable: true, value: options.top ?? 0 });
    }) as typeof dom.window.scrollTo;
    await act(async () => {
      reduceMotion = false;
      mediaListeners.forEach((listener) => listener());
    });
    assert.equal(gallery.hasAttribute("data-scroll-gallery"), true);
    assert.equal(container.querySelectorAll("article.story-featured:not([hidden])").length, 3);
    await act(async () => navigationButton("Next project").click());
    assert.equal(
      container.querySelector('a[aria-current="true"]')?.getAttribute("href"),
      "#debby-arts",
    );
    assert.match(track.style.transform, /-1264px/);

    // An expanded case study releases pinning so its full content remains readable.
    await act(async () => {
      const details = gallery.querySelector<HTMLDetailsElement>(
        '[data-project-slug="debby-arts"] details',
      )!;

      details.open = true;
      details.dispatchEvent(new dom.window.Event("toggle"));
    });
    assert.equal(gallery.hasAttribute("data-scroll-gallery"), false);
    assert.equal(visibleProject(), "debby-arts");
    assert.equal(track.style.transform, "");
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
