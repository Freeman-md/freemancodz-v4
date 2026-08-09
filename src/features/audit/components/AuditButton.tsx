"use client";

import { ArrowRight } from "lucide-react";
import { assistantTriggerEvent } from "@/contracts/assistant.contract";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/utils/class-names";

const auditAssistantMessage = "I would like to claim my free customer journey and workflow audit.";

export function AuditButton({
  className,
  label = "Claim My Free Audit",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Button
      className={cn("mt-9 h-12 rounded-sm px-6 font-mono text-xs font-semibold", className)}
      size="lg"
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent(assistantTriggerEvent, {
            detail: { message: auditAssistantMessage },
          }),
        );
      }}
    >
      {label}
      <ArrowRight size={15} strokeWidth={2.25} />
    </Button>
  );
}
