import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AssistantTriggerButton } from "@/features/assistant/components/AssistantTriggerButton";
import type { AssistantTriggerDetail } from "@/contracts/assistant.contract";
import { buttonVariants } from "@/shared/components/ui/Button";
import { cn } from "@/shared/utils/class-names";
import type { PortfolioAction as PortfolioActionModel } from "../types";
import { PortfolioIcon } from "./PortfolioIcon";

const actionVariant = {
  GHOST: "outline",
  LINK: "link",
  PRIMARY: "signal",
  SECONDARY: "light",
} as const;

const assistantVariant = {
  GHOST: "ghost",
  LINK: "text",
  PRIMARY: "marketing",
  SECONDARY: "ghost",
} as const;

function getPortfolioActionMode(action: PortfolioActionModel) {
  if (action.assistantMessage) {
    return "assistant" as const;
  }

  if (action.url) {
    return "link" as const;
  }

  return "hidden" as const;
}

export function PortfolioAction({
  action,
  assistantDetail,
  className,
}: {
  action: PortfolioActionModel;
  assistantDetail?: Omit<AssistantTriggerDetail, "message">;
  className?: string;
}) {
  const content = (
    <>
      <PortfolioIcon aria-hidden="true" className="size-5" name={action.iconName} />
      {action.label}
      <ArrowRight aria-hidden="true" className="ml-auto size-5" />
    </>
  );

  const mode = getPortfolioActionMode(action);

  if (mode === "assistant" && action.assistantMessage) {
    return (
      <AssistantTriggerButton
        className={className}
        detail={{ message: action.assistantMessage, ...assistantDetail }}
        variant={assistantVariant[action.variant]}
      >
        {content}
      </AssistantTriggerButton>
    );
  }

  if (mode === "hidden" || !action.url) {
    return null;
  }

  return (
    <Link
      className={cn(
        buttonVariants({ size: "lg", variant: actionVariant[action.variant] }),
        className,
      )}
      href={action.url}
    >
      {content}
    </Link>
  );
}
