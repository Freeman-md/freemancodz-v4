"use client";

import type { RefObject } from "react";
import { ArrowUp } from "lucide-react";

export function AssistantComposer({
  canSubmit,
  input,
  subject,
  onInputChange,
  onSubmit,
  textareaRef,
  maxLength,
}: {
  canSubmit: boolean;
  input: string;
  subject: string | null;
  onInputChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  maxLength: number;
}) {
  return (
    <form
      className="assistant-composer"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      {subject && (
        <p className="assistant-draft-subject" id="portfolio-chat-context">
          About {subject}
        </p>
      )}
      <label htmlFor="portfolio-chat-input">Your message</label>
      <div className="assistant-composer-field">
        <textarea
          id="portfolio-chat-input"
          ref={textareaRef}
          value={input}
          rows={2}
          maxLength={maxLength}
          aria-describedby={subject ? "portfolio-chat-context" : undefined}
          placeholder="Ask a question…"
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void onSubmit();
            }
          }}
        />
        <button
          type="submit"
          className="assistant-send"
          aria-label="Send message"
          disabled={!canSubmit}
        >
          <ArrowUp size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
