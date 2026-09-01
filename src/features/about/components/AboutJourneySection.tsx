import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { PortfolioIcon } from "@/features/portfolio/components/PortfolioIcon";
import type {
  AboutPresentationData,
  PortfolioExperience,
} from "@/features/portfolio/models/portfolio-presentation";

function JourneyStage({
  experience,
  index,
  isCurrent,
}: {
  experience: PortfolioExperience;
  index: number;
  isCurrent: boolean;
}) {
  const icon = experience.icons[0];

  return (
    <article className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-6">
      <div className="relative z-10 flex justify-center">
        <span
          className={`flex size-11 items-center justify-center rounded-full border bg-white font-mono text-sm font-semibold sm:size-12 ${
            isCurrent
              ? "border-signal-300 text-signal-700 shadow-soft"
              : "border-line text-slate-500"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div
        className={`pb-10 ${isCurrent ? "rounded-2xl border border-signal-100 bg-signal-50/30 p-5 sm:p-6" : "pt-1"}`}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {icon ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-signal-100 bg-white text-signal-700">
              <PortfolioIcon
                aria-hidden="true"
                className="size-5 stroke-[1.7]"
                name={icon.iconName}
              />
            </div>
          ) : null}
          {experience.tag ? (
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-signal-700">
              {experience.tag}
            </p>
          ) : null}
        </div>
        <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-ink sm:text-3xl">
          {experience.title}
        </h3>
        <p className="mt-4 text-base leading-7 text-slate-700">{experience.copy}</p>
        {experience.insight ? (
          <p className="mt-5 border-l-2 border-signal-400 pl-4 text-sm leading-6 text-slate-600">
            {experience.insight}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function AboutJourneySection({
  experiences,
  journey,
}: Pick<AboutPresentationData, "experiences" | "journey">) {
  return (
    <section
      aria-labelledby="about-journey-heading"
      className="pb-20 pt-8 sm:pb-28 sm:pt-12"
      id="about-journey"
    >
      <Container>
        <div className="lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(28rem,1.15fr)] lg:gap-20 xl:gap-28">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <MarketingSectionHeading
              align="left"
              copy={<p>{journey.copy}</p>}
              eyebrow={journey.eyebrow}
              id="about-journey-heading"
              title={journey.title}
            />
          </div>

          <div className="relative mt-12 space-y-2 before:absolute before:bottom-10 before:left-[1.35rem] before:top-5 before:w-px before:bg-line sm:before:left-[1.6rem] lg:mt-0">
            {experiences.map((experience, index) => (
              <JourneyStage
                experience={experience}
                index={index}
                isCurrent={index === experiences.length - 1}
                key={experience.title}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
