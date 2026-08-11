import { ShieldCheck } from "lucide-react";

import { MarketingVisualCta } from "@/shared/components/marketing/MarketingVisualCta";

import { AuditButton } from "./AuditButton";
import { SignalVisual } from "./SignalVisual";

export function AuditFooterCta() {
  return (
    <MarketingVisualCta
      action={<AuditButton className="mt-0 w-full max-w-lg text-base" label="Start My Free Audit" />}
      align="left"
      copy={
        <p>
          Share one customer journey or operational workflow. My assistant will help you provide the
          relevant context.
        </p>
      }
      eyebrow="Let's fix what's getting in the way"
      helper={
        <p className="mt-5 flex items-center gap-2 text-sm text-slate-500">
          <ShieldCheck aria-hidden="true" className="size-5 text-slate-500" />
          Free. No obligation. Your information is never shared.
        </p>
      }
      id="audit-cta-heading"
      title="Show me one part of your business that isn't running as smoothly as it should."
      visual={<SignalVisual />}
    />
  );
}
