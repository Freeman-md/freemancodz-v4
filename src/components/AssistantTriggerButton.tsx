"use client";

import type { ReactNode } from "react";
import { dispatchOpenPortfolioChat, type OpenPortfolioChatDetail } from "@/features/chat/events";

type AssistantTriggerButtonProps = {
  children: ReactNode;
  className?: string;
  detail?: OpenPortfolioChatDetail;
  variant?: "primary" | "ghost" | "accent" | "text";
};

export function AssistantTriggerButton({
  children,
  className = "",
  detail,
  variant = "ghost",
}: AssistantTriggerButtonProps) {
  const styles = {
    primary: "border border-black bg-black text-white hover:opacity-90",
    accent:
      "border border-accent bg-accent text-white hover:bg-indigo-500 hover:border-indigo-500",
    ghost: "border border-line bg-transparent text-ink hover:bg-surface",
    text: "text-ink hover:text-accent",
  }[variant];

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-5 py-3 font-mono text-[12px] font-medium tracking-[0.02em] transition ${styles} ${className}`}
      onClick={() => {
        dispatchOpenPortfolioChat(detail);
      }}
    >
      {children}
    </button>
  );
}
