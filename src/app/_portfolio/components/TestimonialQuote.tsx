"use client";

import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";

function findPreview(text: string, measure: HTMLDivElement, width: number) {
  measure.style.width = `${width}px`;
  measure.textContent = text;
  const lineHeight = parseFloat(getComputedStyle(measure).lineHeight);

  const limit = lineHeight * 4 + 1;

  if (measure.offsetHeight <= limit) {
    return text;
  }

  // Measure with the same unbreakable suffix as the visible control.
  const content = document.createTextNode("");

  const suffix = document.createElement("span");

  suffix.className = "home-quote-suffix";
  suffix.textContent = "… read more";
  measure.replaceChildren(content, suffix);
  const ends = Array.from(text.matchAll(/\S+(?=\s|$)/g), (word) => word.index + word[0].length);

  let low = 0;

  let high = ends.length - 1;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);

    content.textContent = text.slice(0, ends[middle]);
    if (measure.offsetHeight <= limit) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  return text.slice(0, ends[low]);
}

export function TestimonialQuote({ quote }: { quote: string }) {
  const [expanded, setExpanded] = useState(false);

  const [preview, setPreview] = useState(quote);

  const frame = useRef<HTMLDivElement>(null);

  const content = useRef<HTMLDivElement>(null);

  const measure = useRef<HTMLDivElement>(null);

  const nextStartHeight = useRef<number | null>(null);

  useLayoutEffect(() => {
    const text = content.current;

    const probe = measure.current;

    if (!text || !probe) {
      return;
    }

    let active = true;

    function update() {
      if (active && text && probe && text.clientWidth) {
        setPreview(findPreview(quote, probe, text.clientWidth));
      }
    }

    const observer = new ResizeObserver(update);

    observer.observe(text);
    update();
    void document.fonts.ready.then(update);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [quote]);

  useLayoutEffect(() => {
    const wrapper = frame.current;

    const start = nextStartHeight.current;

    nextStartHeight.current = null;
    if (!wrapper || start === null || !content.current) {
      return;
    }

    const preference = matchMedia("(prefers-reduced-motion: reduce)");

    if (preference.matches) {
      return;
    }

    const animation = wrapper.animate(
      [{ height: `${start}px` }, { height: `${content.current.offsetHeight}px` }],
      { duration: 200, easing: "ease-out" },
    );

    const settle = () => {
      if (preference.matches) {
        animation.cancel();
      }
    };

    preference.addEventListener("change", settle);

    return () => {
      preference.removeEventListener("change", settle);
      animation.cancel();
    };
  }, [expanded]);

  const visible = expanded ? quote : preview;

  const parts = visible.split(/(\s+)/);

  const count = parts.filter((part) => /\S/.test(part)).length;

  const hasMore = preview !== quote;

  return (
    <div className="home-quote-frame" ref={frame}>
      <div className="home-quote-text" ref={content}>
        <span style={{ "--quote-word-count": count } as CSSProperties}>
          {parts.map((part, index) =>
            index % 2 === 0 ? (
              <span
                className="home-quote-word"
                key={index}
                style={{ "--quote-word": index / 2 } as CSSProperties}
              >
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </span>
        {hasMore && (
          <span className="home-quote-suffix">
            {expanded ? " " : "… "}
            <button
              type="button"
              aria-expanded={expanded}
              aria-label={
                expanded ? "Read less of this testimonial" : "Read more of this testimonial"
              }
              onClick={() => {
                nextStartHeight.current = frame.current?.getBoundingClientRect().height ?? null;
                setExpanded(!expanded);
              }}
            >
              {expanded ? "read less" : "read more"}
            </button>
          </span>
        )}
      </div>
      <div className="home-quote-text home-quote-measure" ref={measure} aria-hidden="true" />
    </div>
  );
}
