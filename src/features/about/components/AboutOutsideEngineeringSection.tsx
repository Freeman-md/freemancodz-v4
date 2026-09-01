import { Container } from "@/shared/components/layout/Container";
import Image from "next/image";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { PortfolioIcon } from "@/features/portfolio/components/PortfolioIcon";
import type {
  AboutPresentationData,
  PortfolioMedia,
} from "@/features/portfolio/models/portfolio-presentation";

function InterestCard({ interest, index }: { interest: PortfolioMedia; index: number }) {
  return (
    <article className={index % 2 === 1 ? "mt-8 lg:mt-12" : ""}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface">
        {interest.type === "VIDEO" ? (
          <video className="size-full object-cover" controls src={interest.source} />
        ) : (
          <Image
            alt={interest.altText}
            className="size-full object-cover transition duration-500 hover:scale-[1.025]"
            src={interest.source}
            fill
            sizes="(min-width: 1024px) 18vw, (min-width: 640px) 42vw, 90vw"
          />
        )}
      </div>
      <div className="flex items-center gap-3 px-1 pt-4">
        <PortfolioIcon
          aria-hidden="true"
          className="size-6 text-signal-600"
          name={interest.iconName}
        />
        <h3 className="text-base font-medium text-ink sm:text-lg">{interest.label}</h3>
      </div>
    </article>
  );
}

export function AboutOutsideEngineeringSection({
  outsideEngineering,
}: Pick<AboutPresentationData, "outsideEngineering">) {
  return (
    <section aria-labelledby="about-outside-heading" className="py-20 sm:py-28" id="about-outside">
      <Container>
        <div className="lg:grid lg:grid-cols-[minmax(0,0.7fr)_minmax(32rem,1.3fr)] lg:items-center lg:gap-16 xl:gap-24">
          <div className="flex flex-col justify-center">
            <MarketingSectionHeading
              align="left"
              copy={<p>{outsideEngineering.copy}</p>}
              eyebrow={outsideEngineering.eyebrow}
              id="about-outside-heading"
              title={outsideEngineering.title}
            />
          </div>

          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 lg:mt-0 lg:grid-cols-4">
            {outsideEngineering.media.map((interest, index) => (
              <InterestCard index={index} interest={interest} key={interest.label} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
