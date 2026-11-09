"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TestimonialQuote } from "./TestimonialQuote";
import { testimonials } from "./testimonial-quotes";
import { SectionReveal } from "./SectionReveal";
import "./testimonials.css";

export function Testimonials() {
  const [index, setIndex] = useState(0);

  const quote = useRef<HTMLQuoteElement>(null);

  const testimonial = testimonials[index];

  useEffect(() => {
    const anchor = quote.current;

    if (!anchor) {
      return;
    }

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");

    let frame = 0;

    function update() {
      frame = 0;
      if (!anchor) {
        return;
      }

      const progress = reduced.matches
        ? 1
        : Math.min(
            1,
            Math.max(
              0,
              (innerHeight * 0.8 - anchor.getBoundingClientRect().top) / (innerHeight * 0.55),
            ),
          );

      anchor.style.setProperty("--quote-progress", String(progress));
    }

    function schedule() {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, []);

  function move(direction: number) {
    setIndex((current) => (current + direction + testimonials.length) % testimonials.length);
  }

  return (
    <section className="home-section home-testimonials" aria-labelledby="testimonials">
      <SectionReveal className="home-testimonial-reveal" together>
        <div className="home-testimonial-heading">
          <span aria-hidden="true">TESTIMONIALS</span>
          <h2 id="testimonials" tabIndex={-1}>
            / THEIR WORDS
          </h2>
        </div>
        <div className="home-testimonial-controls" aria-label="Testimonial controls">
          <button type="button" aria-label="Previous testimonial" onClick={() => move(-1)}>
            <ArrowLeft size={14} aria-hidden="true" />
            Previous
          </button>
          <span aria-live="polite">
            0{index + 1} / 0{testimonials.length}
          </span>
          <button type="button" aria-label="Next testimonial" onClick={() => move(1)}>
            Next
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
        <figure className="home-testimonial">
          <span className="home-quote-mark" aria-hidden="true">
            “
          </span>
          <blockquote ref={quote} cite={testimonial.href}>
            <TestimonialQuote key={testimonial.name} quote={testimonial.quote} />
          </blockquote>
          <figcaption>
            <span className="home-quote-initials" aria-hidden="true">
              {testimonial.initials}
            </span>
            <div>
              <a href={testimonial.href}>
                {testimonial.name}
                <ArrowUpRight aria-hidden="true" size={14} />
              </a>
              <p>{testimonial.role}</p>
            </div>
          </figcaption>
        </figure>
      </SectionReveal>
    </section>
  );
}
