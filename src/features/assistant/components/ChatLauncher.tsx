"use client";

import { MessageSquareIcon } from "lucide-react";

type ChatLauncherProps = {
  onOpen: () => void;
};

export function ChatLauncher({ onOpen }: ChatLauncherProps) {
  return (
    <button
      type="button"
      aria-label="Open portfolio chat"
      onClick={onOpen}
      onFocus={onOpen}
      className="flex h-16 w-full items-center gap-3 px-4 text-left text-white"
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
    </button>
  );
}
