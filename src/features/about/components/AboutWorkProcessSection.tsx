import { ArrowDown, ArrowRight, ArrowUp, CircleCheck } from "lucide-react";

import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { PortfolioIcon } from "@/features/portfolio/components/PortfolioIcon";
import type {
  AboutPresentationData,
  PortfolioIcon as PortfolioIconModel,
} from "@/features/portfolio/models/portfolio-presentation";

type ProcessStep = {
  icon: PortfolioIconModel;
  title: string;
  copy: string;
  tone: "success" | "signal";
};

function ProcessNode({ step, index }: { step: ProcessStep; index: number }) {
  const isSuccess = step.tone === "success";

  return (
    <div className="grid grid-cols-[2rem_5rem_1fr] items-center gap-4 lg:flex lg:flex-col lg:text-center">
      <span
        className={`font-mono text-sm font-semibold lg:mb-4 lg:text-base ${
          isSuccess ? "text-success-700" : "text-signal-700"
        }`}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div
        className={`flex size-20 items-center justify-center rounded-full border shadow-[0_12px_28px_-20px_rgba(55,48,163,0.65)] lg:size-24 ${
          isSuccess
            ? "border-success-200 bg-success-50/50 text-success-800"
            : "border-signal-200 bg-signal-50/50 text-signal-800"
        }`}
      >
        <PortfolioIcon
          aria-hidden="true"
          className="size-9 stroke-[1.55] lg:size-10"
          name={step.icon.iconName}
        />
      </div>
      <div>
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-ink lg:mt-5 lg:text-2xl">
          {step.title}
        </h3>
        <p className="mt-1 text-base leading-6 text-slate-600 lg:mt-2 lg:max-w-48 lg:text-lg">
          {step.copy}
        </p>
      </div>
    </div>
  );
}

function DesktopConnector() {
  return (
    <div aria-hidden="true" className="mt-16 hidden min-w-8 items-center text-slate-500 lg:flex">
      <span className="h-px flex-1 bg-slate-400" />
      <ArrowRight className="-ml-px size-5 shrink-0 stroke-[1.7]" />
    </div>
  );
}

function MobileConnector() {
  return (
    <div aria-hidden="true" className="grid h-12 grid-cols-[2rem_5rem_1fr] gap-4 lg:hidden">
      <span className="col-start-2 mx-auto h-full w-px bg-slate-300" />
    </div>
  );
}

function ProductionFeedback() {
  return (
    <div className="mt-10 flex items-center gap-3 text-success-700 sm:gap-5 lg:mt-12">
      <ArrowUp aria-hidden="true" className="size-5 shrink-0 stroke-[1.7]" />
      <span aria-hidden="true" className="h-px flex-1 border-t border-dashed border-success-400" />
      <p className="shrink-0 rounded-xl border border-success-200 bg-success-50/40 px-4 py-2 text-sm font-medium sm:px-6 sm:text-base">
        Learn from production
      </p>
      <span aria-hidden="true" className="h-px flex-1 border-t border-dashed border-success-400" />
      <ArrowDown aria-hidden="true" className="size-5 shrink-0 stroke-[1.7]" />
    </div>
  );
}

export function AboutWorkProcessSection({
  process,
  profile,
}: Pick<AboutPresentationData, "process" | "profile">) {
  const processSteps: ProcessStep[] = process.icons.map((icon, index) => ({
    icon,
    title: icon.label,
    copy: icon.copy ?? "",
    tone: index < 2 ? "success" : "signal",
  }));

  return (
    <section aria-labelledby="work-process-heading" className="py-20 sm:py-28">
      <Container>
        <MarketingSectionHeading
          align="left"
          copy={<p>{process.copy}</p>}
          eyebrow={process.eyebrow}
          id="work-process-heading"
          title={process.title}
        />

        <div className="mt-14 lg:grid lg:grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto] lg:items-start lg:gap-5">
          {processSteps.map((step, index) => (
            <div className="contents" key={step.title}>
              <ProcessNode index={index} step={step} />
              {index < processSteps.length - 1 ? (
                <>
                  <DesktopConnector />
                  <MobileConnector />
                </>
              ) : null}
            </div>
          ))}
        </div>

        <ProductionFeedback />

        <div className="mt-12 grid gap-4 border-t border-line pt-8 md:grid-cols-3">
          {profile.processPrinciples.map((principle) => (
            <article
              className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-soft sm:p-5"
              key={principle.label}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-success-200 bg-success-50/50 text-success-700">
                <CircleCheck aria-hidden="true" className="size-5 stroke-[1.7]" />
              </div>
              <p className="text-sm font-medium leading-5 text-ink sm:text-base">
                {principle.label}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
