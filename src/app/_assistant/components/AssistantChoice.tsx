"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { AssistantChoice as Choice } from "@/contracts/assistant-choice.contract";

type Props = {
  choice: Choice;
  isLoading: boolean;
  onSend: (message: string) => Promise<void>;
  onWriteReply: () => void;
};

export function AssistantChoice({ choice, isLoading, onSend, onWriteReply }: Props) {
  const [selected, setSelected] = useState("");

  const firstOption = useRef<HTMLInputElement>(null);

  const groupName = useId();

  useEffect(() => {
    if (!isLoading) {
      firstOption.current?.focus({ preventScroll: true });
    }
  }, [isLoading]);

  return (
    <form
      className="assistant-choice"
      onSubmit={(event) => {
        event.preventDefault();
        if (!selected || isLoading) {
          return;
        }

        void onSend(selected);
      }}
    >
      <fieldset aria-label="Reply options" disabled={isLoading}>
        {choice.options.map((option, index) => (
          <label key={option} className="assistant-choice-option">
            <input
              ref={index === 0 ? firstOption : undefined}
              type="radio"
              name={groupName}
              value={option}
              checked={selected === option}
              onChange={() => setSelected(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <div className="assistant-choice-actions">
        <button type="submit" disabled={!selected || isLoading}>
          Send
        </button>
        <button type="button" disabled={isLoading} onClick={onWriteReply}>
          Write my own reply
        </button>
      </div>
    </form>
  );
}
