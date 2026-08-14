import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { PortfolioIcon } from "@/features/portfolio/components/PortfolioIcon";
import type {
  AboutPresentationData,
  PortfolioExperience,
  PortfolioIcon as PortfolioIconModel,
} from "@/features/portfolio/models/portfolio-presentation";

type JourneyNode = PortfolioIconModel;

type JourneyStage = {
  title: string;
  tag: string;
  copy: string;
  note: string;
  nodes: JourneyNode[];
  tone: "signal" | "success";
};

const nodeToneClasses = {
  signal: "border-signal-200 bg-signal-50/60 text-signal-700",
  success: "border-success-200 bg-success-50/60 text-success-700",
};

function StageNodes({ nodes, tone }: { nodes: JourneyNode[]; tone: JourneyStage["tone"] }) {
  return (
    <div className="mt-8 grid grid-cols-[auto_1fr_auto_1fr_auto] items-start">
      {nodes.map(({ iconName, label }, index) => (
        <div className="contents" key={label}>
          <div className="relative z-10 flex flex-col items-center bg-white px-1 text-center">
            <div
              className={`flex size-14 items-center justify-center rounded-full border shadow-[0_10px_24px_-18px_rgba(55,48,163,0.55)] ${nodeToneClasses[tone]}`}
            >
              <PortfolioIcon aria-hidden="true" className="size-6 stroke-[1.6]" name={iconName} />
            </div>
            <p className="mt-3 text-xs font-medium leading-4 text-ink">{label}</p>
          </div>
          {index < nodes.length - 1 ? (
            <span
              aria-hidden="true"
              className={`relative top-7 min-w-3 border-t border-dashed ${tone === "signal" ? "border-signal-400" : "border-success-400"
                }`}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function JourneyCard({ stage, index }: { stage: JourneyStage; index: number }) {
  const isSignal = stage.tone === "signal";

  return (
    <article className="rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-7">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full border bg-white font-mono text-sm font-semibold ${isSignal ? "border-signal-200 text-signal-700" : "border-success-200 text-success-700"
            }`}
        >
          {index + 1}
        </span>
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-ink">{stage.title}</h3>
      </div>
      <p
        className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${isSignal
          ? "border-signal-100 bg-signal-50/60 text-signal-700"
          : "border-success-100 bg-success-50/70 text-success-700"
          }`}
      >
        {stage.tag}
      </p>
      <StageNodes nodes={stage.nodes} tone={stage.tone} />
      <p className="mt-8 border-t border-line pt-6 text-sm leading-6 text-slate-700">
        {stage.copy}
      </p>
      <p
        className={`mt-6 border-l-2 px-3 text-sm leading-5 ${isSignal ? "border-signal-500 text-slate-700" : "border-success-500 text-slate-700"
          }`}
      >
        {stage.note}
      </p>
    </article>
  );
}

function TodayCard({ experience }: { experience: PortfolioExperience }) {
  return (
    <article className="rounded-3xl border border-signal-400 bg-white p-6 shadow-[0_18px_40px_-30px_rgba(55,48,163,0.45)] sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-success-500 bg-success-50 font-mono text-sm font-semibold text-success-700">
          4
        </span>
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-ink">{experience.title}</h3>
      </div>
      <div className="mt-8 space-y-3">
        {experience.icons.map((icon, index) => (
          <div className="contents" key={icon.label}>
            <div className="flex items-center gap-3 rounded-2xl border border-signal-100 bg-signal-50/40 p-4 text-sm font-semibold text-signal-800">
              <PortfolioIcon aria-hidden="true" className="size-6 shrink-0" name={icon.iconName} />
              {icon.label}
            </div>
            {index < experience.icons.length - 1 ? (
              <div aria-hidden="true" className="flex h-6 justify-center">
                <span className="border-l border-dashed border-signal-400" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-8 border-t border-line pt-6 text-sm leading-6 text-slate-700">
        {experience.copy}
      </p>
    </article>
  );
}

export function AboutJourneySection({
  experiences,
  journey,
}: Pick<AboutPresentationData, "experiences" | "journey">) {
  const stages: JourneyStage[] = experiences
    .slice(0, 3)
    .map((item, index) => ({
      title: item.title,
      tag: item.tag ?? "",
      copy: item.copy,
      note: item.insight ?? "",
      nodes: item.icons,
      tone: index === 0 ? "signal" : "success",
    }));

  const today = experiences[3];

  return (
    <section aria-labelledby="about-journey-heading" className="pb-20 pt-8 sm:pb-28 sm:pt-12">
      <Container>
        <MarketingSectionHeading
          align="left"
          copy={<p>{journey.copy}</p>}
          eyebrow={journey.eyebrow}
          id="about-journey-heading"
          title={journey.title}
        />

        <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-4 xl:gap-7">
          {stages.map((stage, index) => (
            <JourneyCard index={index} key={stage.title} stage={stage} />
          ))}
          {today ? <TodayCard experience={today} /> : null}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-full border border-line bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-soft">
          <span className="text-signal-700">Product</span>
          <span aria-hidden="true" className="text-signal-300">
            →
          </span>
          <span className="text-success-700">Operations</span>
          <span aria-hidden="true" className="text-signal-300">
            →
          </span>
          <span className="text-signal-700">Systems</span>
          <span aria-hidden="true" className="text-signal-300">
            →
          </span>
          <span className="text-signal-700">Current focus</span>
        </div>
      </Container>
    </section>
  );
}
