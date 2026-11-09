"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function SectionReveal({
  children,
  className,
  together = false,
}: {
  children: ReactNode;
  className: string;
  together?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const group = ref.current;

    if (!group) {
      return;
    }

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");

    const targets = together ? [group] : Array.from(group.children);

    const pending = new Set(
      targets.filter((target) => target.getBoundingClientRect().top >= innerHeight),
    );

    const observer = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) {
          continue;
        }

        target.removeAttribute("data-reveal-pending");
        if (together) {target.setAttribute("data-reveal-played", "");}

        pending.delete(target);
        observer.unobserve(target);
      }
    });

    function settle() {
      if (!preference.matches) {
        return;
      }

      pending.forEach((card) => card.removeAttribute("data-reveal-pending"));
      pending.clear();
      observer.disconnect();
    }

    if (!preference.matches) {
      pending.forEach((card) => {
        card.setAttribute("data-reveal-pending", "");
        observer.observe(card);
      });
    }

    preference.addEventListener("change", settle);

    return () => {
      preference.removeEventListener("change", settle);
      observer.disconnect();
      pending.forEach((card) => card.removeAttribute("data-reveal-pending"));
    };
  }, [together]);

  return (
    <div ref={ref} className={`${className}${together ? "" : " home-reveal"}`}>
      {children}
    </div>
  );
}
