"use client";

import type { ReactNode } from "react";
import type { AssistantTriggerDetail } from "@/contracts/assistant.contract";
import {
  dispatchOpenPortfolioChat,
  type OpenPortfolioChatDetail,
} from "../assistant.events";
import { Button } from "@/app/_components/ui/Button";
import { cn } from "@/app/_utils/class-names";

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
        variant === "marketing" ? "mx-auto mt-10 w-full max-w-lg gap-5" : null,
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
