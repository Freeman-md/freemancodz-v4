import { ShieldCheck } from "lucide-react";

import { Container } from "@/shared/components/layout/Container";

import { AuditButton } from "./AuditButton";
import { SignalVisual } from "./SignalVisual";

export function AuditFooterCta() {
  return (
    <section aria-labelledby="audit-cta-heading" className="pb-20 pt-16 sm:pb-28 sm:pt-20">
      <Container>
        <div className="overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-10 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)] lg:items-center lg:gap-14 lg:p-16">
          <div className="text-center lg:text-left">
            <p className="inline-flex rounded-full border border-signal-100 bg-signal-50/60 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-signal-800 sm:text-xs">
              Let&apos;s fix what&apos;s getting in the way
            </p>
            <h2
              className="mt-7 text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-slate-950 sm:text-5xl"
              id="audit-cta-heading"
            >
              Show me one part of your business that isn&apos;t running as smoothly as it should.
            </h2>
            <span aria-hidden="true" className="mx-auto mt-7 block h-1 w-14 rounded-full bg-signal-500 lg:mx-0" />
            <p className="mx-auto mt-7 max-w-xl text-lg leading-7 text-slate-700 lg:mx-0">
              Share one customer journey or operational workflow. My assistant will help you
              provide the relevant context.
            </p>
            <div className="order-2 mt-10 lg:hidden">
              <SignalVisual />
            </div>
            <AuditButton
              className="bg-signal-800 px-7 text-base shadow-[0_12px_28px_-14px_rgba(55,48,163,0.72)] hover:bg-signal-900"
              label="Start My Free Audit"
            />
            <p className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500 lg:justify-start">
              <ShieldCheck aria-hidden="true" className="size-5 text-slate-500" />
              Free. No obligation. Your information is never shared.
            </p>
          </div>
          <div className="order-1 hidden lg:block">
            <SignalVisual />
          </div>
        </div>
      </Container>
    </section>
  );
}
