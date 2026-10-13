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

    const scenes = element.querySelectorAll<HTMLElement>(
      ".story-featured-visual, .story-assistant-scene, .story-workflow-scene, .story-person-visual, .story-audit-grid",
    );

    const update = () => {
      frame = 0;
      const distance = Math.min(window.scrollY / 900, 1);

      element.style.setProperty(
        "--scene-travel",
        preference.matches ? "0px" : `${distance * 42}px`,
      );
      element.style.setProperty("--scene-turn", preference.matches ? "0deg" : `${distance * 3}deg`);

      for (const scene of scenes) {
        const bounds = scene.getBoundingClientRect();

        const progress = Math.max(
          0,
          Math.min((window.innerHeight - bounds.top) / (window.innerHeight + bounds.height), 1),
        );

        scene.style.setProperty(
          "--object-progress",
          preference.matches ? "0.5" : progress.toFixed(4),
        );
      }
    };

    const schedule = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
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
    preference.addEventListener("change", update);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", onHashChange);
      preference.removeEventListener("change", update);
      observer.disconnect();
      element.removeAttribute("data-motion-ready");
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
