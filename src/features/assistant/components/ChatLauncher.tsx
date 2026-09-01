"use client";

import { MessageSquareIcon } from "lucide-react";
import type { Ref } from "react";

import { Button } from "@/shared/components/ui/Button";

type ChatLauncherProps = {
  buttonRef: Ref<HTMLButtonElement>;
  onFocus: () => void;
  onOpen: () => void;
};

export function ChatLauncher({ buttonRef, onFocus, onOpen }: ChatLauncherProps) {
  return (
    <Button
      ref={buttonRef}
      type="button"
      aria-label="Open portfolio chat"
      onClick={onOpen}
      onFocus={onFocus}
      variant="ghost"
      className="h-16 w-full justify-start gap-3 rounded-none px-4 text-left text-white hover:bg-white/5 hover:text-white"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white">
        <MessageSquareIcon aria-hidden="true" className="size-4.5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/58">
          Ask AI
        </span>
        <span className="truncate text-sm font-medium text-white">
          Ask about work, systems, or research
        </span>
      </span>
      <span className="ml-1 size-2 shrink-0 rounded-full bg-[#5b4df8]" />
    </Button>
  );
}
