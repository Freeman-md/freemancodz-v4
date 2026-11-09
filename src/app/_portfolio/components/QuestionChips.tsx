"use client";

import { useEffect, useRef } from "react";
import { MessageCircleQuestionMark } from "lucide-react";
import { dispatchOpenPortfolioChat } from "../../_assistant/assistant.events";
import "./question-chips.css";

export function QuestionChips({
  subject,
  questions,
  onQuestion,
}: {
  subject: string;
  questions: readonly string[];
  onQuestion?: (text: string) => void;
}) {
  const row = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = row.current;

    if (!scroller) {
      return;
    }

    function update() {
      if (scroller) {
        scroller.toggleAttribute(
          "data-more",
          scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1,
        );
      }
    }

    const observer = new ResizeObserver(update);

    observer.observe(scroller);
    for (const chip of scroller.children) {
      observer.observe(chip);
    }

    scroller.addEventListener("scroll", update, { passive: true });
    update();

    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div className="home-questions" role="group" aria-label={`Questions about ${subject}`}>
      <MessageCircleQuestionMark aria-hidden="true" size={17} />
      <div className="home-chip-window">
        <div ref={row} className="home-chip-scroll">
          {questions.map((text) => (
            <button
              key={text}
              type="button"
              onFocus={(event) => {
                const scroller = row.current;

                if (!scroller) {
                  return;
                }

                const clip = scroller.getBoundingClientRect();

                const chip = event.currentTarget.getBoundingClientRect();

                if (chip.left < clip.left + 4) {
                  scroller.scrollLeft += chip.left - clip.left - 4;
                }

                if (chip.right > clip.right - 4) {
                  scroller.scrollLeft += chip.right - clip.right + 4;
                }
              }}
              onClick={(event) => {
                if (onQuestion) {
                  onQuestion(text);
                } else {
                  dispatchOpenPortfolioChat({
                    draft: { subject, text },
                    returnFocus: event.currentTarget,
                  });
                }
              }}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
