import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BriefcaseBusiness,
  Code2,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  TerminalSquare,
} from "lucide-react";

import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import type { PortfolioProject, WorkPresentationData } from "../models/portfolio-presentation";

type SupportingProject = {
  title: string;
  category: string;
  description: string;
  tone: "success" | "violet";
  visual: "voice" | "recovery";
  href: string;
};

function toSupportingProject(
  project: PortfolioProject,
  description: string,
  tone: SupportingProject["tone"],
  visual: SupportingProject["visual"],
): SupportingProject {
  return {
    title: project.title,
    category: project.category,
    description,
    tone,
    visual,
    href: project.externalLinks[0] ?? "#",
  };
}

const badgeClasses: Record<SupportingProject["tone"], string> = {
  success: "bg-success-50 text-success-700",
  violet: "bg-violet-50 text-violet-700",
};

function DarkVisual({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-full min-h-[11rem] overflow-hidden bg-[radial-gradient(circle_at_50%_25%,#18255c_0%,#071534_48%,#020817_100%)] p-4 text-white">
      <span className="absolute inset-x-0 top-1/2 h-px bg-signal-500/20" />
      {children}
    </div>
  );
}

function VoiceVisual() {
  return (
    <DarkVisual>
      <div className="relative z-10 flex w-full flex-col justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-violet-600">
            <AudioLines aria-hidden="true" className="size-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight">shifty</span>
        </div>
        <svg aria-hidden="true" className="h-16 w-full text-violet-500" fill="none" viewBox="0 0 220 70">
          <path
            d="M0 37h18l7-7 8 18 9-42 10 58 10-44 8 27 9-12 8 2h19l7-5 8 17 9-37 9 48 10-33 8 10h18l7-9 7 18 8-23 9 16 9-2h15"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </div>
    </DarkVisual>
  );
}

function RecoveryVisual() {
  const steps: Array<[LucideIcon, string]> = [
    [Siren, "Detect"],
    [Stethoscope, "Diagnose"],
    [TerminalSquare, "Recover"],
    [ShieldCheck, "Verify"],
  ];

  return (
    <DarkVisual>
      <div className="relative z-10 grid w-full grid-cols-2 gap-2 self-center">
        {steps.map(([Icon, label]) => (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-center" key={label}>
            <Icon aria-hidden="true" className="mx-auto size-4 text-orange-400" />
            <span className="mt-1 block text-[9px] font-medium text-slate-200">{label}</span>
          </div>
        ))}
      </div>
    </DarkVisual>
  );
}

function ProjectVisual({ visual }: Pick<SupportingProject, "visual">) {
  if (visual === "voice") {
    return <VoiceVisual />;
  }

  return <RecoveryVisual />;
}

function SupportingProjectCard({ project }: { project: SupportingProject }) {
  return (
    <article className="grid min-h-[15rem] grid-cols-[minmax(8rem,40%)_1fr] overflow-hidden rounded-2xl border border-line bg-white shadow-soft sm:grid-cols-[minmax(10rem,42%)_1fr]">
      <div className="border-r border-line">
        <ProjectVisual visual={project.visual} />
      </div>
      <div className="flex min-w-0 flex-col p-4 sm:p-5">
        <p className={`w-fit max-w-full rounded px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.04em] ${badgeClasses[project.tone]}`}>
          {project.category}
        </p>
        <h3 className="mt-4 text-xl font-semibold leading-6 tracking-[-0.035em] text-ink sm:text-2xl">
          {project.title}
        </h3>
        <p className="mt-2 text-sm leading-5 text-slate-700">{project.description}</p>
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-5">
          <a className="inline-flex items-center gap-1.5 text-xs font-semibold text-signal-700 hover:text-signal-900" href={project.href} rel="noreferrer" target="_blank">
            View Case Study <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
          <a className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950" href={project.href} rel="noreferrer" target="_blank">
            <Code2 aria-hidden="true" className="size-3.5" /> GitHub <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}

export function WorkAdditionalSection({ additionalWork, projects }: Pick<WorkPresentationData, "additionalWork" | "projects">) {
  const supportingProjects: SupportingProject[] = [
    toSupportingProject(projects.shifty, "Voice assistant that helps teams fill open shifts faster through natural conversation.", "violet", "voice"),
    toSupportingProject(projects.selfHealing, "Detects incidents, diagnoses the likely cause and recovers automatically with safeguards.", "success", "recovery"),
  ];

  return (
    <section aria-labelledby="additional-work-heading" className="bg-white py-20 sm:py-28">
      <Container className="max-w-[1340px]">
        <MarketingSectionHeading
          eyebrow={additionalWork.eyebrow}
          id="additional-work-heading"
          title={additionalWork.title}
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {supportingProjects.map((project) => (
            <SupportingProjectCard key={project.title} project={project} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="flex items-center gap-5">
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
            <span className="flex size-12 items-center justify-center rounded-full border border-signal-100 bg-signal-50 text-signal-700 shadow-soft">
              <BriefcaseBusiness aria-hidden="true" className="size-5" />
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </div>
          <p className="mt-5 text-base text-slate-600">More projects and experiments are always in progress.</p>
          <a className="mt-2 inline-flex items-center gap-2 font-semibold text-signal-700 hover:text-signal-900" href="#work-cta">
            Let&apos;s build something together
            <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      </Container>
    </section>
  );
}
