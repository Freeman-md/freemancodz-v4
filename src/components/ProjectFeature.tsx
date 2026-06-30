import type { Project } from "@/data/projects";
import { Chip } from "./Chip";

export function ProjectFeature({
  project,
  reverse = false,
}: {
  project: Project;
  reverse?: boolean;
}) {
  return (
    <article className="grid items-start gap-8 md:grid-cols-12 md:gap-6">
      <div
        className={`rounded-sm border border-line bg-white p-3 transition hover:border-neutral-300 hover:shadow-soft md:p-8 ${
          reverse ? "md:order-2 md:col-span-7" : "md:col-span-7"
        }`}
      >
        <div className="flex aspect-[4/3] items-end rounded-sm border border-line bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_28%),linear-gradient(160deg,#101010,#262626_72%,#0b0b0b)] p-6 text-white">
          <div className="w-full rounded-sm border border-white/10 bg-black/30 p-5 backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/70">
                {project.category}
              </span>
              <span className="font-mono text-[11px] text-white/55">System View</span>
            </div>
            <h3 className="max-w-[14rem] text-2xl font-medium tracking-[-0.03em]">
              {project.title}
            </h3>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {project.stack.slice(0, 4).map((item) => (
                <div
                  key={item}
                  className="rounded-sm border border-white/10 bg-white/5 px-3 py-3 font-mono text-[11px] text-white/70"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div
        className={`flex h-full flex-col justify-center space-y-6 ${
          reverse ? "md:order-1 md:col-span-5" : "md:col-span-5"
        }`}
      >
        <div>
          <h2 className="text-2xl font-medium tracking-[-0.03em] text-ink md:text-[28px]">
            {project.title}
          </h2>
          <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">
            {project.role}
          </p>
        </div>
        <p className="text-base leading-7 text-ink">{project.detail}</p>
        <div className="border-l-4 border-black pl-4">
          <strong className="block font-mono text-[12px] tracking-[0.02em] text-ink">
            Outcome / Proof
          </strong>
          <p className="mt-2 text-sm leading-6 text-muted">{project.outcome}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.stack.slice(0, 5).map((item) => (
            <Chip key={item}>{item}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          {project.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[12px] text-ink underline decoration-line underline-offset-4 transition hover:text-accent"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}
