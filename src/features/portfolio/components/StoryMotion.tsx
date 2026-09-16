"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Keep reading content visible; only the project planes respond to native scrolling. */
export function StoryMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");

    let frame = 0;

    if (!element) {
      return;
    }

    const update = () => {
      frame = 0;
      const distance = Math.min(window.scrollY / 900, 1);

      element.style.setProperty(
        "--scene-travel",
        preference.matches ? "0px" : `${distance * 42}px`,
      );
      element.style.setProperty("--scene-turn", preference.matches ? "0deg" : `${distance * 3}deg`);
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
      { threshold: 0.25 },
    );

    element
      .querySelectorAll(".story-assistant-object, .story-workflow-object, .story-audit-paper")
      .forEach((target) => observer.observe(target));

    update();
    revealDestination(true);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("hashchange", onHashChange);
    preference.addEventListener("change", update);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("hashchange", onHashChange);
      preference.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
