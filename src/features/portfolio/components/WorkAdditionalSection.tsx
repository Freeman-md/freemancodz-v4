import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BookOpenText,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  FileText,
  MessageSquareText,
  Search,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  TerminalSquare,
} from "lucide-react";

import { Container } from "@/shared/components/layout/Container";

type SupportingProject = {
  title: string;
  category: string;
  description: string;
  tone: "signal" | "success" | "violet" | "orange" | "slate";
  visual: "voice" | "recovery" | "meeting" | "analytics" | "knowledge" | "open-source";
  href: string;
};

const supportingProjects: SupportingProject[] = [
  {
    title: "Shifty",
    category: "Hackathon · Voice AI",
    description: "Voice assistant that helps teams fill open shifts faster through natural conversation.",
    tone: "violet",
    visual: "voice",
    href: "https://github.com/Freeman-md",
  },
  {
    title: "Self-Healing Backend Operations System",
    category: "MSc Research · Systems",
    description: "Detects incidents, diagnoses the likely cause and recovers automatically with safeguards.",
    tone: "success",
    visual: "recovery",
    href: "https://github.com/Freeman-md",
  },
  {
    title: "Meeting Assistant",
    category: "AI · Prototype",
    description: "AI assistant that captures key discussion points and surfaces clear action items.",
    tone: "signal",
    visual: "meeting",
    href: "https://github.com/Freeman-md",
  },
  {
    title: "Analytics Dashboard",
    category: "Data · Experiment",
    description: "Exploring product usage patterns through event tracking and clean visual insights.",
    tone: "orange",
    visual: "analytics",
    href: "https://github.com/Freeman-md",
  },
  {
    title: "Knowledge Base Assistant",
    category: "AI · Experiment",
    description: "RAG-powered guidance for internal documentation with sources and citations.",
    tone: "signal",
    visual: "knowledge",
    href: "https://github.com/Freeman-md",
  },
  {
    title: "Open Source Contributions",
    category: "Open source",
    description: "Meaningful improvements to developer tools and practical AI infrastructure projects.",
    tone: "slate",
    visual: "open-source",
    href: "https://github.com/Freeman-md",
  },
];

const badgeClasses: Record<SupportingProject["tone"], string> = {
  signal: "bg-signal-50 text-signal-700",
  success: "bg-success-50 text-success-700",
  violet: "bg-violet-50 text-violet-700",
  orange: "bg-orange-50 text-orange-700",
  slate: "bg-slate-100 text-slate-700",
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

function MeetingVisual() {
  return (
    <div className="relative flex h-full min-h-[11rem] items-center justify-center overflow-hidden bg-signal-50/60 p-4">
      <div className="absolute left-3 top-5 h-[72%] w-[70%] rotate-[-4deg] rounded-xl border border-signal-100 bg-white/70" />
      <div className="relative w-full rounded-xl border border-signal-100 bg-white p-3 shadow-soft">
        <div className="flex items-center gap-2 text-[9px] font-semibold text-signal-800">
          <MessageSquareText aria-hidden="true" className="size-4" /> Meeting notes
        </div>
        <div className="mt-3 grid grid-cols-[1fr_2.25rem] gap-2">
          <div className="space-y-2">
            <span className="block h-2 rounded-full bg-slate-100" />
            <span className="block h-2 w-4/5 rounded-full bg-slate-100" />
            <span className="block h-2 w-2/3 rounded-full bg-slate-100" />
          </div>
          <div className="space-y-1.5">
            {[1, 2, 3].map((item) => (
              <span className="flex size-5 items-center justify-center rounded-full bg-signal-50" key={item}>
                <CheckCircle2 aria-hidden="true" className="size-3 text-signal-600" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  return (
    <div className="flex h-full min-h-[11rem] flex-col bg-orange-50/40 p-4">
      <div className="grid grid-cols-3 gap-2">
        {["12.4K", "63%", "8.2m"].map((metric) => (
          <span className="rounded-lg border border-orange-100 bg-white p-2 text-center text-[10px] font-semibold text-slate-700" key={metric}>
            {metric}
          </span>
        ))}
      </div>
      <svg aria-hidden="true" className="mt-auto h-20 w-full text-orange-500" fill="none" viewBox="0 0 220 82">
        <path d="M0 70L28 52L50 59L77 28L104 45L129 21L156 35L184 14L220 23" stroke="currentColor" strokeWidth="2" />
        <path d="M0 70L28 52L50 59L77 28L104 45L129 21L156 35L184 14L220 23V82H0Z" fill="currentColor" opacity=".08" />
      </svg>
    </div>
  );
}

function KnowledgeVisual() {
  return (
    <div className="relative flex h-full min-h-[11rem] items-center justify-center overflow-hidden bg-signal-50/60 p-4">
      <div className="absolute right-4 top-5 w-[68%] rounded-xl border border-signal-100 bg-white/75 p-3 opacity-70">
        <FileText aria-hidden="true" className="size-4 text-signal-600" />
        <span className="mt-3 block h-2 rounded-full bg-slate-100" />
        <span className="mt-2 block h-2 w-2/3 rounded-full bg-slate-100" />
      </div>
      <div className="relative mr-7 mt-9 w-[78%] rounded-xl border border-signal-100 bg-white p-3 shadow-soft">
        <div className="flex items-center gap-2 text-[9px] font-semibold text-signal-800">
          <BookOpenText aria-hidden="true" className="size-4" /> Knowledge search
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 text-[8px] text-slate-400">
          <Search aria-hidden="true" className="size-3" /> Ask the documentation…
        </div>
      </div>
    </div>
  );
}

function OpenSourceVisual() {
  return (
    <DarkVisual>
      <pre className="relative z-10 self-center whitespace-pre-wrap font-mono text-[8px] leading-4 text-slate-300">
        <span className="text-orange-400">export</span> <span className="text-violet-300">async function</span>{" "}
        <span className="text-blue-300">recover</span>() {"{"}
        {"\n  "}<span className="text-orange-300">const</span> result = <span className="text-blue-300">await</span> diagnose();
        {"\n  "}<span className="text-violet-300">if</span> (result.safe) {"{"}
        {"\n    "}<span className="text-blue-300">return</span> verify(result);
        {"\n  "}{"}"}
        {"\n"}{"}"}
      </pre>
    </DarkVisual>
  );
}

function ProjectVisual({ visual }: Pick<SupportingProject, "visual">) {
  if (visual === "voice") {
    return <VoiceVisual />;
  }

  if (visual === "recovery") {
    return <RecoveryVisual />;
  }

  if (visual === "meeting") {
    return <MeetingVisual />;
  }

  if (visual === "analytics") {
    return <AnalyticsVisual />;
  }

  if (visual === "knowledge") {
    return <KnowledgeVisual />;
  }

  return <OpenSourceVisual />;
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

export function WorkAdditionalSection() {
  return (
    <section aria-labelledby="additional-work-heading" className="bg-white py-20 sm:py-28">
      <Container className="max-w-[1340px]">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl" id="additional-work-heading">
            Additional Work &amp; Experiments
          </h2>
          <span aria-hidden="true" className="mx-auto mt-6 block h-1 w-16 rounded-full bg-signal-600" />
        </div>

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
