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
      className="h-12 w-full justify-center gap-2 rounded-none px-4 text-left text-ink hover:bg-black/5 hover:text-ink"
    >
      <MessageSquareIcon aria-hidden="true" className="size-4" />
      <span className="hidden text-[13px] font-medium sm:inline">Ask assistant</span>
    </Button>
  );
}
