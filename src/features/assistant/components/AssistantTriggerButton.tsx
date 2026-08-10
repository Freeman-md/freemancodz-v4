"use client";

import type { ReactNode } from "react";
import type { AssistantTriggerDetail } from "@/contracts/assistant.contract";
import {
  dispatchOpenPortfolioChat,
  type OpenPortfolioChatDetail,
} from "@/features/assistant/assistant.events";
import { marketingCtaClasses } from "@/shared/components/marketing/MarketingCtaLink";
import { cn } from "@/shared/utils/class-names";

type AssistantTriggerButtonProps = {
  children: ReactNode;
  className?: string;
  detail?: AssistantTriggerDetail;
  variant?: "primary" | "ghost" | "accent" | "marketing" | "text";
};

export function AssistantTriggerButton({
  children,
  className = "",
  detail,
  variant = "ghost",
}: AssistantTriggerButtonProps) {
  const styles = {
    primary: "border border-black bg-black text-white hover:opacity-90",
    accent: "border border-accent bg-accent text-white hover:bg-indigo-500 hover:border-indigo-500",
    ghost: "border border-line bg-transparent text-ink hover:bg-surface",
    marketing: marketingCtaClasses,
    text: "text-ink hover:text-accent",
  }[variant];

  const baseStyles =
    variant === "marketing"
      ? ""
      : "inline-flex items-center justify-center gap-2 rounded-sm px-5 py-3 font-mono text-[12px] font-medium tracking-[0.02em] transition";

  return (
    <button
      type="button"
      className={cn(baseStyles, styles, className)}
      onClick={() => {
        dispatchOpenPortfolioChat(detail);
      }}
    >
      {children}
    </button>
  );
}
