"use client";

import type { KeyboardEvent, RefObject } from "react";
import { ArrowUpIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/Button";
import { Textarea } from "@/app/_components/ui/Textarea";
import { MAX_MESSAGE_LENGTH } from "../constants";

type AssistantComposerProps = {
  canSubmit: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

export function AssistantComposer({
  canSubmit,
  input,
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
      className="flex shrink-0 flex-col gap-1 border-t border-black/8 bg-white px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:h-[6.5rem] sm:justify-center sm:px-6 sm:py-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <div className="flex items-end gap-3">
        <label htmlFor="portfolio-chat-input" className="sr-only">
          Ask a question about Freeman&apos;s portfolio
        </label>
        <div className="min-w-0 flex-1 border-b border-black/12 has-[textarea:focus-visible]:border-signal-700">
          <Textarea
            id="portfolio-chat-input"
            name="portfolio-chat-input"
            ref={textareaRef}
            value={input}
            aria-label="Ask a question about Freeman's portfolio"
            placeholder="Ask a question…"
            className="h-11 max-h-28 min-h-11 resize-none overflow-y-auto rounded-none border-0 bg-transparent px-0 py-2.5 text-base/6 text-ink shadow-none placeholder:text-base placeholder:text-muted focus-visible:outline-0 focus-visible:ring-0"
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
          variant="ghost"
          size="icon"
          className="relative size-10 shrink-0 rounded-xl bg-ink text-white hover:bg-ink/90 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-500 disabled:bg-[#F5F5F7] disabled:text-[#4B5A64] disabled:opacity-100"
        >
          <ArrowUpIcon aria-hidden="true" className="size-4" />
          <span
            aria-hidden="true"
            className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
          />
        </Button>
      </div>
      <p className="font-sans text-[0.6875rem]/4 text-muted">
        Enter to send · Shift + Enter for a new line
      </p>
    </form>
  );
}
