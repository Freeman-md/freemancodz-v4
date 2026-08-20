import { ShieldCheck } from "lucide-react";

import { MarketingVisualCta } from "@/shared/components/marketing/MarketingVisualCta";

import { AuditButton } from "./AuditButton";
import { SignalVisual } from "./SignalVisual";
import type { AuditPresentationData } from "@/features/portfolio/models/portfolio-presentation";

export function AuditFooterCta({ closing }: Pick<AuditPresentationData, "closing">) {
  return (
    <MarketingVisualCta
      action={closing.actions.map((action) => (
        <AuditButton
          action={action}
          className="mt-0 w-full max-w-lg text-base"
          entryPoint="audit-footer-cta"
          key={action.label}
        />
      ))}
      align="left"
      copy={<p>{closing.copy}</p>}
      eyebrow={closing.eyebrow}
      helper={
        <p className="mt-5 flex items-center gap-2 text-sm text-slate-500">
          <ShieldCheck aria-hidden="true" className="size-5 text-slate-500" />
          Free. No obligation. Your information is never shared.
        </p>
      }
      sectionId="audit-cta"
      title={closing.title}
      visual={<SignalVisual />}
    />
  );
}
