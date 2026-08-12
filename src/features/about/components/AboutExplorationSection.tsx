import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { PortfolioIcon } from "@/features/portfolio/components/PortfolioIcon";
import type { AboutPresentationData, PortfolioIcon as PortfolioIconModel } from "@/features/portfolio/models/portfolio-presentation";

type ExplorationStep = {
  icon: PortfolioIconModel;
  title: string;
  copy: string;
  tone: string;
};

const tones = ["border-sky-200 bg-sky-50 text-blue-700", "border-amber-200 bg-amber-50 text-amber-600", "border-violet-200 bg-violet-50 text-violet-700", "border-success-200 bg-success-50 text-success-700", "border-signal-200 bg-signal-50 text-signal-700"];

function HumanControl({ step }: { step: PortfolioIconModel }) {
  return (
    <div className="mx-auto flex w-fit items-center gap-4 rounded-2xl border border-signal-100 bg-white px-6 py-4 shadow-soft">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-signal-50 text-signal-700">
        <PortfolioIcon aria-hidden="true" className="size-7 stroke-[1.7]" name={step.iconName} />
      </div>
      <div>
        <p className="font-semibold uppercase tracking-[0.04em] text-signal-700">{step.label}</p>
        <p className="mt-1 text-sm text-slate-600">{step.copy}</p>
      </div>
    </div>
  );
}

function DesktopExplorationFlow({ control, steps }: { control: PortfolioIconModel; steps: ExplorationStep[] }) {
  return (
    <div className="relative mt-16 hidden lg:block">
      <HumanControl step={control} />
      <div aria-hidden="true" className="mx-auto h-12 w-px border-l border-dashed border-signal-300" />
      <div className="grid grid-cols-5 gap-7">
        {steps.map(({ icon, title, copy, tone }, index) => (
          <article className="relative text-center" key={title}>
            {index > 0 ? (
              <div aria-hidden="true" className="absolute right-1/2 top-16 flex w-full items-center px-2">
                <span className="h-px flex-1 bg-signal-300" />
                <span className="size-2 rotate-45 border-r border-t border-signal-500" />
              </div>
            ) : null}
            <div
              className={`relative z-10 mx-auto flex size-32 items-center justify-center rounded-full border shadow-[0_18px_40px_-28px_rgba(55,48,163,0.5)] ${tone}`}
            >
              <PortfolioIcon aria-hidden="true" className="size-14 stroke-[1.45]" name={icon.iconName} />
            </div>
            <h3 className="mt-6 text-base font-bold uppercase tracking-[0.02em] text-slate-900">
              {title}
            </h3>
            <p className="mx-auto mt-3 max-w-48 text-sm leading-6 text-slate-600">{copy}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function MobileExplorationFlow({ control, steps }: { control: PortfolioIconModel; steps: ExplorationStep[] }) {
  return (
    <div className="mt-8 rounded-3xl border border-line bg-white p-5 shadow-soft lg:hidden">
      <HumanControl step={control} />
      <div className="relative mt-8 space-y-4 before:absolute before:bottom-10 before:left-10 before:top-10 before:border-l before:border-dashed before:border-signal-300">
        {steps.map(({ icon, title, copy, tone }) => (
          <article className="relative z-10 grid gap-x-2 grid-cols-[5rem_1fr] items-center" key={title}>
            <div
              className={`flex size-20 items-center justify-center rounded-full border shadow-[0_14px_30px_-24px_rgba(55,48,163,0.55)] ${tone}`}
            >
              <PortfolioIcon aria-hidden="true" className="size-9 stroke-[1.5]" name={icon.iconName} />
            </div>
            <div className="rounded-2xl border border-line bg-white px-5 py-4">
              <h3 className="font-bold uppercase tracking-[0.02em] text-slate-900">{title}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-600">{copy}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ControlPrinciples({ principles }: { principles: PortfolioIconModel[] }) {
  return (
    <div className="mt-16 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8">
      <h3 className="text-center font-semibold uppercase tracking-[0.04em] text-signal-700">
        Control principles
      </h3>
      <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {principles.map(({ iconName, label, copy }, index) => (
          <article
            className={`flex gap-4 ${index > 0 ? "xl:border-l xl:border-line xl:pl-7" : ""}`}
            key={label}
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-signal-50 text-signal-700">
              <PortfolioIcon aria-hidden="true" className="size-6 stroke-[1.6]" name={iconName} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">{label}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function AboutExplorationSection({ exploration, profile }: Pick<AboutPresentationData, "exploration" | "profile">) {
  const control = exploration.icons[0];

  const steps = exploration.icons.slice(1).map((icon, index) => ({ icon, title: icon.label, copy: icon.copy ?? "", tone: tones[index] }));

  if (!control) {return null;}

  return (
    <section aria-labelledby="exploration-heading" className="py-20 sm:py-28">
      <Container>
        <MarketingSectionHeading
          align="left"
          eyebrow={exploration.eyebrow}
          id="exploration-heading"
          title={exploration.title}
        />

        <DesktopExplorationFlow control={control} steps={steps} />
        <MobileExplorationFlow control={control} steps={steps} />
        <ControlPrinciples principles={profile.controlPrinciples} />
      </Container>
    </section>
  );
}
