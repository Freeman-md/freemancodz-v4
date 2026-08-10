"use client";

import type { ReactNode } from "react";
import type { AssistantTriggerDetail } from "@/contracts/assistant.contract";
import {
  dispatchOpenPortfolioChat,
  type OpenPortfolioChatDetail,
} from "@/features/assistant/assistant.events";
import { marketingCtaClasses } from "@/shared/components/marketing/MarketingCtaLink";
import { Button } from "@/shared/components/ui/Button";
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
  const buttonVariant = {
    accent: "signal",
    ghost: "outline",
    marketing: "signal",
    primary: "primary",
    text: "link",
  }[variant] as "signal" | "outline" | "primary" | "link";

  return (
    <Button
      type="button"
      variant={buttonVariant}
      size={variant === "marketing" ? "lg" : variant === "text" ? "sm" : "lg"}
      className={cn(
        "font-mono text-[12px] tracking-[0.02em]",
        variant === "marketing" ? marketingCtaClasses : null,
        className,
      )}
      onClick={() => {
        dispatchOpenPortfolioChat(detail);
      }}
    >
      {children}
    </Button>
  );
}
