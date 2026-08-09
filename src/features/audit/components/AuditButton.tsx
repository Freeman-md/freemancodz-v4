"use client";

import { ArrowRight } from "lucide-react";
import { assistantTriggerEvent } from "@/contracts/assistant.contract";
import { Button } from "@/shared/components/ui/Button";

const auditAssistantMessage = "I would like to claim my free customer journey and workflow audit.";

export function AuditButton() {
  return (
    <Button
      className="mt-9 h-12 rounded-sm px-6 font-mono text-xs font-semibold"
      size="lg"
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent(assistantTriggerEvent, {
            detail: { message: auditAssistantMessage },
          }),
        );
      }}
    >
      Claim My Free Audit
      <ArrowRight size={15} strokeWidth={2.25} />
    </Button>
  );
}
