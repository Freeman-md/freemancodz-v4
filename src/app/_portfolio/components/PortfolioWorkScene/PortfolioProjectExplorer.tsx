"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

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

  // Every project is readable in the initial HTML; navigation enhances it after hydration.
  const hash = useSyncExternalStore(
    subscribeToDestination,
    () => window.location.hash,
    () => null,
  );

  const activeSlug = projectSlugFromHash(hash, panels);

  const activeIndex = Math.max(
    0,
    panels.findIndex(({ slug }) => slug === activeSlug),
  );

  useEffect(() => {
    if (activeSlug && hash === `#${activeSlug}`) {
      // Keep the project controls visible after revealing an initially hidden destination.
      const frame = window.requestAnimationFrame(() => {
        explorer.current?.scrollIntoView({ behavior: "instant", block: "start" });
      });

      return () => window.cancelAnimationFrame(frame);
    }
  }, [activeSlug, hash]);

  function moveTo(index: number) {
    const panel = panels[index];

    if (panel) {
      window.location.hash = panel.slug;
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
      {panels.map((panel) => (
        <span className="story-project-anchor" id={panel.slug} key={panel.slug} aria-hidden="true" />
      ))}
      <nav className="story-project-navigation" aria-label="Selected projects">
        <ol role="list" className="story-project-choices">
          {panels.map((panel, index) => (
            <li key={panel.slug}>
              <a
                href={`#${panel.slug}`}
                aria-current={activeSlug === panel.slug ? "true" : undefined}
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
      <div className="story-project-panels">
        {panels.map((panel) => (
          <article
            className="story-featured"
            key={panel.slug}
            data-project-slug={panel.slug}
            aria-labelledby={`${panel.slug}-title`}
            hidden={activeSlug !== null && activeSlug !== panel.slug}
          >
            {panel.content}
          </article>
        ))}
      </div>
    </div>
  );
}
