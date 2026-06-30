import type { Experience } from "@/data/experience";
import { Chip } from "./Chip";

export function ExperienceCard({ experience }: { experience: Experience }) {
  return (
    <article className="flex h-full flex-col rounded-sm border border-line bg-white p-8 transition hover:border-neutral-300 hover:shadow-soft">
      <div className="mb-8 flex items-start justify-between gap-4">
        <Chip>{experience.category}</Chip>
        <span className="font-mono text-[11px] text-muted">{experience.dates}</span>
      </div>
      <h3 className="text-2xl font-medium tracking-[-0.03em] text-ink">
        {experience.title}
      </h3>
      <p className="mt-2 text-sm text-muted">{experience.company}</p>
      <p className="mt-auto border-t border-dashed border-line pt-5 text-sm leading-6 text-muted">
        {experience.focus}
      </p>
    </article>
  );
}
