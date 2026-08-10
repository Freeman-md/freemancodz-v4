"use client";

import type { KeyboardEvent, RefObject } from "react";
import { ArrowUpIcon, MessageSquareIcon, XIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { Textarea } from "@/shared/components/ui/Textarea";
import { cn } from "@/shared/utils/class-names";
import { MAX_MESSAGE_LENGTH } from "../constants";

type ChatComposerProps = {
  canSubmit: boolean;
  errorMessage: string | null;
  input: string;
  isLoading: boolean;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

export function ChatComposer({
  canSubmit,
  errorMessage,
  input,
  isLoading,
  onClose,
  onInputChange,
  onKeyDown,
  onSubmit,
  textareaRef,
}: ChatComposerProps) {
  return (
    <form
      className="flex h-16 items-center gap-3 px-4 sm:px-5"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <label htmlFor="portfolio-chat-input" className="sr-only">
        Ask a question about Freeman&apos;s portfolio
      </label>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
        <MessageSquareIcon aria-hidden="true" className="size-4.5" />
      </span>

      <div className="min-w-0 flex-1">
        <Textarea
          id="portfolio-chat-input"
          ref={textareaRef}
          value={input}
          aria-label="Ask a question about Freeman's portfolio"
          placeholder={errorMessage || "Ask me a question"}
          className={cn(
            "h-10 max-h-10 min-h-10 resize-none overflow-y-auto border-0 bg-transparent px-0 py-2 text-sm leading-6 text-ink shadow-none placeholder:font-mono placeholder:text-[12px] placeholder:tracking-[0.02em] placeholder:text-muted focus-visible:ring-0",
            errorMessage ? "placeholder:text-red-700" : null,
          )}
          onChange={(event) => {
            onInputChange(event.target.value);
          }}
          onKeyDown={onKeyDown}
          maxLength={MAX_MESSAGE_LENGTH}
        />
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        variant="primary"
        size="icon"
        className="size-10 shrink-0 rounded-full"
      >
        <ArrowUpIcon />
      </Button>
      <Button
        type="button"
        aria-label="Collapse portfolio chat"
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        onClick={onClose}
        disabled={isLoading}
      >
        <XIcon />
      </Button>
    </form>
  );
}
