"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { dispatchOpenPortfolioChat, type AssistantDraft } from "../../_assistant/assistant.events";
import type { ExperienceStop } from "@/contracts/public-portfolio.contract";
import { QuestionChips } from "./QuestionChips";

export function ExperienceTimeline({
  experienceStops,
}: {
  experienceStops: readonly ExperienceStop[];
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const [open, setOpen] = useState(false);

  const timeline = useRef<HTMLOListElement>(null);

  const origin = useRef<HTMLButtonElement | null>(null);

  const close = useRef<HTMLButtonElement>(null);

  const pendingDraft = useRef<AssistantDraft | null>(null);

  useEffect(() => {
    const list = timeline.current;

    if (!list) {
      return;
    }

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");

    let frame = 0;

    function update() {
      frame = 0;
      if (!list) {
        return;
      }

      const top = list.getBoundingClientRect().top;

      const progress = reduced.matches
        ? 1
        : Math.max(0, Math.min(1, (innerHeight * 0.75 - top) / (innerHeight * 0.5)));

      list.style.setProperty("--rail-progress", String(progress));
      Array.from(list.children).forEach((stop, index) => {
        stop.toggleAttribute(
          "data-reached",
          (reduced.matches || top <= innerHeight * 0.75) &&
            progress >= index / Math.max(1, experienceStops.length - 1),
        );
      });
    }

    function schedule() {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    }

    const resize = new ResizeObserver(schedule);

    resize.observe(document.body);
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, [experienceStops.length]);

  const stop = selected === null ? null : experienceStops[selected];

  return (
    <Dialog.Root
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen && pendingDraft.current && origin.current) {
          const draft = pendingDraft.current;

          pendingDraft.current = null;
          dispatchOpenPortfolioChat({ draft, returnFocus: origin.current });
        }
      }}
    >
      <ol className="home-timeline" ref={timeline}>
        {experienceStops.map((item, index) => (
          <li key={item.name}>
            <button
              type="button"
              aria-haspopup="dialog"
              className="home-stop"
              onClick={(event) => {
                origin.current = event.currentTarget;
                setSelected(index);
                setOpen(true);
              }}
            >
              <span className="home-stop-index" aria-hidden="true">
                0{index + 1}
              </span>
              <span className="home-stop-card">
                <span>{item.period}</span>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      {stop && (
        <Dialog.Portal>
          <Dialog.Backdrop className="home-experience-backdrop" />
          <Dialog.Popup
            className="home-experience-detail"
            initialFocus={close}
            finalFocus={() => (pendingDraft.current ? false : origin.current)}
          >
            <header>
              <div>
                <p>{stop.label}</p>
                <Dialog.Title>{stop.name}</Dialog.Title>
              </div>
              <Dialog.Close ref={close} aria-label="Close experience detail">
                <X size={18} aria-hidden="true" />
              </Dialog.Close>
            </header>
            {typeof stop.detail === "string" ? (
              <p>{stop.detail}</p>
            ) : (
              <div className="home-experience-responsibilities">
                <h3>Responsibilities</h3>
                <ul>
                  {stop.detail.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            <QuestionChips
              subject={stop.name}
              questions={stop.questions}
              onQuestion={(text) => {
                pendingDraft.current = { subject: stop.name, text };
                setOpen(false);
              }}
            />
          </Dialog.Popup>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
