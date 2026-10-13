"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

type ProjectPanel = {
  slug: string;
  title: string;
  content: ReactNode;
};

function subscribeToDestination(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);

  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function projectSlugFromHash(hash: string | null, panels: ProjectPanel[]) {
  if (hash === null) {
    return null;
  }

  let destination: string;

  try {
    destination = decodeURIComponent(hash.slice(1));
  } catch {
    return panels[0]?.slug ?? null;
  }

  return panels.find(({ slug }) => slug === destination)?.slug ?? panels[0]?.slug ?? null;
}

export function PortfolioProjectExplorer({ panels }: { panels: ProjectPanel[] }) {
  const explorer = useRef<HTMLDivElement>(null);

  const track = useRef<HTMLDivElement>(null);

  const [scrollIndex, setScrollIndex] = useState<number | null>(null);

  const scrollToProject = useRef<((index: number) => void) | null>(null);

  // Every project is readable in the initial HTML; navigation enhances it after hydration.
  const hash = useSyncExternalStore(
    subscribeToDestination,
    () => window.location.hash,
    () => null,
  );

  const activeSlug = projectSlugFromHash(hash, panels);

  const activeIndex =
    scrollIndex ??
    Math.max(
      0,
      panels.findIndex(({ slug }) => slug === activeSlug),
    );

  useEffect(() => {
    const element = explorer.current;

    const panelsElement = track.current;

    if (!element || !panelsElement) {
      return;
    }

    const desktop = window.matchMedia("(min-width: 1101px) and (min-height: 850px)");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let frame = 0;

    let enabled = false;

    let index = 0;

    const cards = Array.from(panelsElement.querySelectorAll<HTMLElement>("article.story-featured"));

    const update = () => {
      frame = 0;
      if (!enabled) {
        return;
      }

      const bounds = element.getBoundingClientRect();

      const distance = bounds.height - (window.innerHeight - 112);

      const progress = Math.max(0, Math.min(1, (112 - bounds.top) / Math.max(1, distance)));

      const travel = panelsElement.scrollWidth - element.clientWidth;

      panelsElement.style.transform = `translate3d(${-progress * travel}px, 0, 0)`;
      index = Math.round(progress * (panels.length - 1));
      setScrollIndex(index);
    };

    const schedule = () => {
      if (!frame && !document.hidden) {
        frame = window.requestAnimationFrame(update);
      }
    };

    const seek = (next: number) => {
      const bounds = element.getBoundingClientRect();

      window.scrollTo({
        top:
          window.scrollY +
          bounds.top -
          112 +
          ((bounds.height - (window.innerHeight - 112)) * next) / Math.max(1, panels.length - 1),
        behavior: "instant",
      });
      update();
    };

    const configure = (event?: Event) => {
      const wasEnabled = enabled;

      if (event?.target instanceof HTMLDetailsElement && event.target.open) {
        const openedCard = event.target.closest<HTMLElement>("article.story-featured");

        if (openedCard) {
          index = cards.indexOf(openedCard);
        }
      }

      const bounds = element.getBoundingClientRect();

      const inView = bounds.top < window.innerHeight && bounds.bottom > 112;

      // Reading an expanded case study takes priority over the pinned presentation.
      enabled = desktop.matches && !reduced.matches && !element.querySelector("details[open]");
      element.toggleAttribute("data-scroll-gallery", enabled);
      scrollToProject.current = enabled ? seek : null;
      if (enabled) {
        setScrollIndex(index);
        if (wasEnabled !== enabled && inView) {
          seek(index);
        } else {
          schedule();
        }
      } else {
        panelsElement.style.removeProperty("transform");
        setScrollIndex(null);
        if (wasEnabled && inView) {
          const slug = panels[index]?.slug;

          if (slug) {
            window.history.replaceState(null, "", `#${slug}`);
            window.dispatchEvent(new window.HashChangeEvent("hashchange"));
          }

          element.scrollIntoView({ behavior: "instant", block: "start" });
        }
      }
    };

    const focus = (event: FocusEvent) => {
      if (
        !enabled ||
        !(event.target instanceof HTMLElement) ||
        !event.target.matches(":focus-visible")
      ) {
        return;
      }

      const card = event.target.closest<HTMLElement>("article.story-featured");

      if (card) {
        seek(cards.indexOf(card));
      }
    };

    configure();
    desktop.addEventListener("change", configure);
    reduced.addEventListener("change", configure);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    element.addEventListener("toggle", configure, true);
    element.addEventListener("focusin", focus);

    return () => {
      window.cancelAnimationFrame(frame);
      desktop.removeEventListener("change", configure);
      reduced.removeEventListener("change", configure);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      element.removeEventListener("toggle", configure, true);
      element.removeEventListener("focusin", focus);
      element.removeAttribute("data-scroll-gallery");
      panelsElement.style.removeProperty("transform");
      scrollToProject.current = null;
    };
  }, [panels]);

  useEffect(() => {
    if (activeSlug && hash === `#${activeSlug}`) {
      // Keep the project controls visible after revealing an initially hidden destination.
      const frame = window.requestAnimationFrame(() => {
        if (scrollToProject.current) {
          scrollToProject.current(panels.findIndex((panel) => panel.slug === activeSlug));
        } else {
          explorer.current?.scrollIntoView({ behavior: "instant", block: "start" });
        }
      });

      return () => window.cancelAnimationFrame(frame);
    }
  }, [activeSlug, hash, panels]);

  function moveTo(index: number) {
    const panel = panels[index];

    if (panel) {
      if (scrollToProject.current) {
        scrollToProject.current(index);
      } else {
        window.location.assign(`#${panel.slug}`);
      }
    }
  }

  return (
    <div
      className="story-project-explorer"
      id="selected-projects"
      ref={explorer}
      data-enhanced={activeSlug !== null || undefined}
    >
      {/* Native fragment navigation and enhanced selection share the controls' position. */}
      {panels.map((panel, index) => (
        <span
          className="story-project-anchor"
          id={panel.slug}
          key={panel.slug}
          aria-hidden="true"
          style={{
            top:
              scrollIndex === null
                ? 0
                : `calc((100% - (100svh - 112px)) * ${index / Math.max(1, panels.length - 1)})`,
          }}
        />
      ))}
      <div className="story-project-sticky">
        <nav className="story-project-navigation" aria-label="Selected projects">
          <ol role="list" className="story-project-choices">
            {panels.map((panel, index) => (
              <li key={panel.slug}>
                <a
                  href={`#${panel.slug}`}
                  aria-current={activeIndex === index && activeSlug !== null ? "true" : undefined}
                  onClick={(event) => {
                    if (scrollToProject.current) {
                      event.preventDefault();
                      moveTo(index);
                    }
                  }}
                >
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  {panel.title}
                </a>
              </li>
            ))}
          </ol>
          <div className="story-project-controls">
            <p aria-live="polite" aria-atomic="true">
              {activeIndex + 1} / {panels.length}
            </p>
            <button
              type="button"
              aria-label="Previous project"
              disabled={activeIndex === 0}
              onClick={() => moveTo(activeIndex - 1)}
            >
              <ArrowLeft aria-hidden="true" size={20} />
            </button>
            <button
              type="button"
              aria-label="Next project"
              disabled={activeIndex === panels.length - 1}
              onClick={() => moveTo(activeIndex + 1)}
            >
              <ArrowRight aria-hidden="true" size={20} />
            </button>
          </div>
        </nav>
        <div className="story-project-viewport">
          <div className="story-project-panels" ref={track}>
            {panels.map((panel) => (
              <article
                className="story-featured"
                key={panel.slug}
                data-project-slug={panel.slug}
                aria-labelledby={`${panel.slug}-title`}
                hidden={scrollIndex === null && activeSlug !== null && activeSlug !== panel.slug}
              >
                {panel.content}
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
