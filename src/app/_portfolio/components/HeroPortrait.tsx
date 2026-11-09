"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export function HeroPortrait() {
  const portrait = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const image = portrait.current;

    if (!image) {
      return;
    }

    const mobile = matchMedia("(max-width: 700px)");

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");

    let frame = 0;

    function update() {
      frame = 0;
      const progress = Math.min(1, Math.max(0, scrollY / (mobile.matches ? 300 : 600)));

      const scale = reduced.matches ? 1 : 1 + progress * (mobile.matches ? 0.08 : 0.15);

      image?.style.setProperty("--portrait-scale", String(scale));
      image?.style.setProperty(
        "--portrait-light",
        String(reduced.matches ? 1 : 0.55 + progress * 0.45),
      );
    }

    function schedule() {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    mobile.addEventListener("change", schedule);
    reduced.addEventListener("change", schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      mobile.removeEventListener("change", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, []);

  return (
    <div className="home-portrait-entrance">
      <div className="home-portrait-scroll" ref={portrait}>
        <Image
          src="/images/homepage/hero-slope-v3.png"
          alt="Freeman Madudili"
          width={1145}
          height={1374}
          sizes="(max-width: 700px) 340px, 435px"
          preload
        />
      </div>
    </div>
  );
}
