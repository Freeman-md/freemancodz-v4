import type { Project } from "@/data/projects";
import { Chip } from "./Chip";

export function ProjectCard({
  project,
  compact = false,
}: {
  project: Project;
  compact?: boolean;
}) {
  return (
    <article className="group flex h-full flex-col rounded-sm border border-line bg-white p-8 transition hover:border-neutral-300 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Chip>{project.category}</Chip>
          <Chip>{project.role}</Chip>
        </div>
      </div>
      <h3 className="mt-6 text-2xl font-medium tracking-[-0.03em] text-ink">
        {project.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-muted">{project.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {project.stack
          .slice(0, compact ? 3 : 5)
          .map((item) => (
            <Chip key={item}>{item}</Chip>
          ))}
      </div>
      <p className="mt-6 border-l-4 border-black pl-4 text-sm leading-6 text-ink">
        {project.outcome}
      </p>
      <div className="mt-auto flex flex-wrap gap-4 pt-8">
        {project.links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-ink underline decoration-line underline-offset-4 transition hover:text-accent"
          >
            {link.label}
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </article>
  );
}
