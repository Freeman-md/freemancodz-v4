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
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  UserCheck,
} from "lucide-react";

import { Container } from "@/shared/components/layout/Container";

type FlowStep = {
  icon: LucideIcon;
  label: string;
};

const customerFlow: FlowStep[] = [
  { icon: Search, label: "Find" },
  { icon: Lightbulb, label: "Understand" },
  { icon: Scale, label: "Decide" },
  { icon: Send, label: "Act" },
];

const operationalFlow: FlowStep[] = [
  { icon: Download, label: "Capture" },
  { icon: GitBranch, label: "Route" },
  { icon: UserCheck, label: "Decide" },
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
        isSignal ? "border-signal-100 bg-signal-50/20" : "border-emerald-100 bg-emerald-50/20"
      }`}
    >
      <h3
        className={`text-lg font-semibold leading-6 ${
          isSignal ? "text-signal-700" : "text-emerald-700"
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
                    : "border-emerald-200 text-emerald-700"
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
                  isSignal ? "text-signal-500" : "text-emerald-600"
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
        <div className="max-w-5xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-signal-700">
            How I think about products
          </p>
          <h2
            className="mt-5 font-display text-4xl leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl"
            id="product-thinking-heading"
          >
            The interface is only half the product
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700 sm:text-xl">
            A product only works when the customer-facing experience and the operational workflow
            behind it work together.
          </p>
        </div>

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
