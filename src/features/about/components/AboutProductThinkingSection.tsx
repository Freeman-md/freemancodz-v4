import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  ArrowRight,
  CircleCheck,
  Download,
  GitBranch,
  Lightbulb,
  Scale,
  Search,
  MousePointer2,
  ShieldCheck,
  SlidersHorizontal,
  Target,
} from "lucide-react";

import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";

type FlowStep = {
  icon: LucideIcon;
  label: string;
};

const customerFlow: FlowStep[] = [
  { icon: Search, label: "Find" },
  { icon: Lightbulb, label: "Understand" },
  { icon: Scale, label: "Decide" },
  { icon: MousePointer2, label: "Act" },
];

const operationalFlow: FlowStep[] = [
  { icon: Download, label: "Capture" },
  { icon: GitBranch, label: "Route" },
  { icon: Scale, label: "Decide" },
  { icon: CircleCheck, label: "Complete" },
];

const principles: FlowStep[] = [
  { icon: Target, label: "Understand the real problem first" },
  { icon: SlidersHorizontal, label: "Automate the routine, keep judgement where it matters" },
  { icon: ShieldCheck, label: "Reliability is part of the product" },
];

function ProductFlow({
  title,
  steps,
  tone,
}: {
  title: string;
  steps: FlowStep[];
  tone: "signal" | "success";
}) {
  const isSignal = tone === "signal";

  return (
    <section
      className={`rounded-3xl border p-5 sm:p-7 lg:grid lg:grid-cols-[12rem_1fr] lg:items-center lg:gap-8 ${
        isSignal ? "border-signal-100 bg-signal-50/20" : "border-success-100 bg-success-50/20"
      }`}
    >
      <h3
        className={`text-lg font-semibold leading-6 ${
          isSignal ? "text-signal-700" : "text-success-700"
        }`}
      >
        {title}
      </h3>
      <div className="mt-6 grid grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto] items-start lg:mt-0">
        {steps.map(({ icon: Icon, label }, index) => (
          <div className="contents" key={label}>
            <div className="flex min-w-0 flex-col items-center text-center">
              <div
                className={`flex size-14 items-center justify-center rounded-full border bg-white shadow-[0_10px_24px_-18px_rgba(55,48,163,0.55)] sm:size-16 ${
                  isSignal
                    ? "border-signal-200 text-signal-700"
                    : "border-success-200 text-success-700"
                }`}
              >
                <Icon aria-hidden="true" className="size-6 stroke-[1.7] sm:size-7" />
              </div>
              <p className="mt-3 text-xs font-medium leading-4 text-ink sm:text-sm">{label}</p>
            </div>
            {index < steps.length - 1 ? (
              <div
                aria-hidden="true"
                className={`relative top-7 flex min-w-3 items-center sm:top-8 ${
                  isSignal ? "text-signal-500" : "text-success-600"
                }`}
              >
                <span className="h-px flex-1 bg-current opacity-60" />
                <ArrowRight className="-ml-px size-4 shrink-0 stroke-[1.8]" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function Handoff() {
  return (
    <div className="relative z-10 mx-auto my-6 w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-line bg-white px-4 py-4 shadow-soft sm:px-6">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-sm font-medium text-slate-700 sm:text-base">
        <span>Customer action</span>
        <ArrowRight aria-hidden="true" className="size-4 text-signal-600" />
        <span>Clear handoff</span>
        <ArrowRight aria-hidden="true" className="size-4 text-signal-600" />
        <span>Reliable response</span>
      </div>
      <ArrowDown
        aria-hidden="true"
        className="absolute -bottom-8 left-1/2 size-5 -translate-x-1/2 text-signal-400"
      />
    </div>
  );
}

export function AboutProductThinkingSection() {
  return (
    <section aria-labelledby="product-thinking-heading" className="py-20 sm:py-28">
      <Container>
        <MarketingSectionHeading
          align="left"
          copy={
            <p>
              A product only works when the customer-facing experience and the operational workflow behind it
              work together.
            </p>
          }
          eyebrow="How I think about products"
          id="product-thinking-heading"
          title="The interface is only half the product"
        />

        <div className="mt-12 rounded-3xl border border-line bg-white p-4 shadow-soft sm:p-6">
          <ProductFlow title="Customer-facing experience" steps={customerFlow} tone="signal" />
          <Handoff />
          <ProductFlow title="Operational workflow" steps={operationalFlow} tone="success" />
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {principles.map(({ icon: Icon, label }) => (
            <article
              className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-soft sm:p-5"
              key={label}
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-signal-100 bg-signal-50/50 text-signal-700">
                <Icon aria-hidden="true" className="size-5 stroke-[1.7]" />
              </div>
              <p className="text-sm font-semibold leading-5 text-ink sm:text-base">{label}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
