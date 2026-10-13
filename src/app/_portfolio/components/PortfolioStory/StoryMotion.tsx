"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Keep reading content visible while native scrolling moves the scene's visual objects. */
export function StoryMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");

    let frame = 0;

    if (!element) {
      return;
    }

    const hero = element.querySelector<HTMLElement>(".story-hero");

    const heroStage = element.querySelector<HTMLElement>(".story-hero-sticky");

    const words = element.querySelectorAll<HTMLElement>("[data-story-word]");

    const statement = element.querySelector<HTMLElement>("#systems-title");

    const pinned = window.matchMedia("(min-width: 1101px) and (min-height: 850px)");

    const scenes = element.querySelectorAll<HTMLElement>(
      ".story-featured-visual, .story-assistant-scene, .story-workflow-scene, .story-person-visual, .story-audit-grid",
    );

    const update = () => {
      frame = 0;
      // Read geometry together before changing styles; no React renders on scroll.
      const heroBounds = hero?.getBoundingClientRect();

      const heroHeight = heroStage?.offsetHeight ?? 0;

      const statementBounds = statement?.getBoundingClientRect();

      const sceneBounds = Array.from(scenes, (scene) => scene.getBoundingClientRect());

      const clamp = (value: number) => Math.max(0, Math.min(value, 1));

      element.toggleAttribute("data-motion-enabled", !preference.matches);

      if (hero && heroBounds) {
        const progress = pinned.matches
          ? clamp((80 - heroBounds.top) / Math.max(1, heroBounds.height - heroHeight))
          : clamp(-heroBounds.top / Math.max(1, heroBounds.height));

        hero.style.setProperty("--hero-progress", preference.matches ? "0" : progress.toFixed(4));
      }

      if (statementBounds) {
        const progress = clamp(
          (window.innerHeight * 0.85 - statementBounds.top) / (window.innerHeight * 0.45),
        );

        words.forEach((word, index) => {
          const amount = preference.matches ? 1 : clamp(progress * (words.length + 1) - index);

          word.style.opacity = String(0.25 + amount * 0.75);
          word.style.transform = `translateY(${(1 - amount) * 12}px)`;
        });
      }

      scenes.forEach((scene, index) => {
        const bounds = sceneBounds[index]!;

        const progress = clamp(
          (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height),
        );

        scene.style.setProperty(
          "--object-progress",
          preference.matches ? "0.5" : progress.toFixed(4),
        );
      });
    };

    const schedule = () => {
      if (!document.hidden && !frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      } else {
        schedule();
      }
    };

    const revealDestination = (initial = false) => {
      let id: string;

      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }

      const target = document.getElementById(id);

      if (!target) {
        return;
      }

      // The explorer reveals project destinations and keeps its navigation in view.
      if (target.closest(".story-project-explorer")) {
        return;
      }

      let expanded = false;

      let disclosure: HTMLDetailsElement | null = null;

      if (target instanceof HTMLDetailsElement) {
        disclosure = target;
      } else if (target.tagName === "ARTICLE") {
        disclosure = target.querySelector("details");
      }

      if (disclosure && !disclosure.open) {
        disclosure.open = true;
        expanded = true;
      }

      let parent = target.parentElement;

      while (parent) {
        if (parent instanceof HTMLDetailsElement && !parent.open) {
          parent.open = true;
          expanded = true;
        }

        parent = parent.parentElement;
      }

      if (expanded || initial) {
        target.scrollIntoView({ behavior: "instant", block: "start" });
      }
    };

    const onHashChange = () => revealDestination();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-arrived", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px -40px 0px" },
    );

    element
      .querySelectorAll(
        ".story-section-intro, .story-featured-visual, .story-featured-copy, .story-assistant-object, .story-workflow-object, .story-more > h2, .story-more-list > article, .story-testimonials h2, .story-testimonial-list > figure, .story-person-visual, .story-person-copy > h2, .story-person-copy > p, .story-person-copy > details, .story-audit-copy > h2, .story-audit-copy > p, .story-audit-paper",
      )
      .forEach((target) => {
        target.classList.add("story-reveal");
        observer.observe(target);
      });

    update();
    element.setAttribute("data-motion-ready", "true");
    revealDestination(true);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    preference.addEventListener("change", update);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      preference.removeEventListener("change", update);
      observer.disconnect();
      element.removeAttribute("data-motion-ready");
      element.removeAttribute("data-motion-enabled");
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
