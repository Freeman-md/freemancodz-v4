import { ArrowDown, ArrowRight } from "lucide-react";

import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { PortfolioIcon } from "@/features/portfolio/components/PortfolioIcon";
import type {
  AboutPresentationData,
  PortfolioIcon as PortfolioIconModel,
} from "@/features/portfolio/models/portfolio-presentation";

type FlowStep = PortfolioIconModel;

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
      className={`rounded-3xl border p-5 sm:p-7 lg:grid lg:grid-cols-[12rem_1fr] lg:items-center lg:gap-8 ${isSignal ? "border-signal-100 bg-signal-50/20" : "border-success-100 bg-success-50/20"
        }`}
    >
      <h3
        className={`text-lg font-semibold leading-6 ${isSignal ? "text-signal-700" : "text-success-700"
          }`}
      >
        {title}
      </h3>
      <div className="mt-6 grid grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto] items-start lg:mt-0">
        {steps.map(({ iconName, label }, index) => (
          <div className="contents" key={label}>
            <div className="flex min-w-0 flex-col items-center text-center">
              <div
                className={`flex size-14 items-center justify-center rounded-full border bg-white shadow-[0_10px_24px_-18px_rgba(55,48,163,0.55)] sm:size-16 ${isSignal
                  ? "border-signal-200 text-signal-700"
                  : "border-success-200 text-success-700"
                  }`}
              >
                <PortfolioIcon
                  aria-hidden="true"
                  className="size-6 stroke-[1.7] sm:size-7"
                  name={iconName}
                />
              </div>
              <p className="mt-3 text-xs font-medium leading-4 text-ink sm:text-sm">{label}</p>
            </div>
            {index < steps.length - 1 ? (
              <div
                aria-hidden="true"
                className={`relative top-7 flex min-w-3 items-center sm:top-8 ${isSignal ? "text-signal-500" : "text-success-600"
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

export function AboutProductThinkingSection({
  profile,
  thinking,
}: Pick<AboutPresentationData, "profile" | "thinking">) {
  return (
    <section aria-labelledby="product-thinking-heading" className="py-20 sm:py-28">
      <Container>
        <MarketingSectionHeading
          align="left"
          copy={<p>{thinking.copy}</p>}
          eyebrow={thinking.eyebrow}
          id="product-thinking-heading"
          title={thinking.title}
        />

        <div className="mt-12 rounded-3xl border border-line bg-white p-4 shadow-soft sm:p-6">
          <ProductFlow
            title={thinking.customer.title}
            steps={thinking.customer.icons}
            tone="signal"
          />
          <Handoff />
          <ProductFlow
            title={thinking.workflow.title}
            steps={thinking.workflow.icons}
            tone="success"
          />
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {profile.thinkingPrinciples.map(({ iconName, label }) => (
            <article
              className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-soft sm:p-5"
              key={label}
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-signal-100 bg-signal-50/50 text-signal-700">
                <PortfolioIcon aria-hidden="true" className="size-5 stroke-[1.7]" name={iconName} />
              </div>
              <p className="text-sm font-semibold leading-5 text-ink sm:text-base">{label}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
