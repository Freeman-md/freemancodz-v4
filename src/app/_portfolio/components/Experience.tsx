import type { ExperienceStop } from "@/contracts/public-portfolio.contract";
import { Info } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { ExperienceTimeline } from "./ExperienceTimeline";
import "./experience.css";

export function Experience({
  stops,
  philosophy,
}: {
  stops: readonly ExperienceStop[];
  philosophy: string;
}) {
  return (
    <section className="home-section home-experience" aria-labelledby="experience">
      <SectionHeading id="experience" description={philosophy}>
        And a good developer brings clarity.
      </SectionHeading>
      <p className="home-experience-hint">
        <Info aria-hidden="true" size={17} />
        Select a stop to learn more.
      </p>
      <ExperienceTimeline experienceStops={stops} />
    </section>
  );
}
