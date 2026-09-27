"use client";

import type { KeyboardEvent, RefObject } from "react";
import { ArrowUpIcon, MessageSquareIcon, XIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/Button";
import { Textarea } from "@/app/_components/ui/Textarea";
import { MAX_MESSAGE_LENGTH } from "../constants";

type AssistantComposerProps = {
  canSubmit: boolean;
  input: string;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

export function AssistantComposer({
  canSubmit,
  input,
  onClose,
  onInputChange,
  onSubmit,
  textareaRef,
}: AssistantComposerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void onSubmit();
    }
  }

  return (
    <form
      className="flex min-h-16 items-center gap-3 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:h-16 sm:px-5 sm:py-0"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <label htmlFor="portfolio-chat-input" className="sr-only">
        Ask a question about Freeman&apos;s portfolio
      </label>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-signal-100 bg-signal-50 text-signal-700">
        <MessageSquareIcon aria-hidden="true" className="size-4.5" />
      </span>

      <div className="min-w-0 flex-1 has-[textarea:focus-visible]:shadow-[0_1px_0_var(--brand-link,#087d69)]">
        <Textarea
          id="portfolio-chat-input"
          ref={textareaRef}
          value={input}
          aria-label="Ask a question about Freeman's portfolio"
          placeholder="Ask me a question"
          className="h-10 max-h-10 min-h-10 resize-none overflow-y-auto border-0 bg-transparent px-0 py-2 text-base leading-6 text-ink shadow-none placeholder:text-sm placeholder:text-muted focus-visible:outline-0 focus-visible:ring-0"
          onChange={(event) => {
            onInputChange(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          maxLength={MAX_MESSAGE_LENGTH}
        />
      </div>

      <Button
        type="submit"
        aria-label="Send message"
        disabled={!canSubmit}
        variant="primary"
        size="icon"
        className="size-10 shrink-0 rounded-full"
      >
        <ArrowUpIcon aria-hidden="true" />
      </Button>
      <Button
        type="button"
        aria-label="Collapse portfolio chat"
        variant="ghost"
        size="icon-sm"
        className="hidden shrink-0 sm:inline-flex"
        onClick={onClose}
      >
        <XIcon />
      </Button>
    </form>
  );
}
