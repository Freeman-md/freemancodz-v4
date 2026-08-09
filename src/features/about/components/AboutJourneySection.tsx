import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Braces,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  GitBranch,
  Link2,
  Network,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";

import { Container } from "@/shared/components/layout/Container";

type JourneyNode = {
  icon: LucideIcon;
  label: string;
};

type JourneyStage = {
  title: string;
  tag: string;
  copy: string;
  note: string;
  nodes: JourneyNode[];
  tone: "signal" | "success";
};

const stages: JourneyStage[] = [
  {
    title: "Pay4Me",
    tag: "Customer-facing products",
    copy: "Worked on payment features, customer interfaces, backend API functionality, critical journeys, and release support.",
    note: "Started close to the customer experience, while already working beyond the interface.",
    nodes: [
      { icon: Smartphone, label: "Interfaces" },
      { icon: Braces, label: "APIs" },
      { icon: Cloud, label: "Production" },
    ],
    tone: "signal",
  },
  {
    title: "The Hippodrome Casino",
    tag: "Live operations",
    copy: "Observed high-volume service up close—accuracy, procedures, real-time decisions, communication, and escalation.",
    note: "Saw the human operation behind a live customer experience.",
    nodes: [
      { icon: Users, label: "People" },
      { icon: ClipboardCheck, label: "Process" },
      { icon: Bell, label: "Decisions" },
    ],
    tone: "success",
  },
  {
    title: "Beyond the interface",
    tag: "Systems thinking",
    copy: "The question became not just what users see, but what happens after they act.",
    note: "The question became not just what users see, but what happens after they act.",
    nodes: [
      { icon: Link2, label: "Integrations" },
      { icon: GitBranch, label: "Workflows" },
      { icon: ShieldCheck, label: "Reliability" },
    ],
    tone: "success",
  },
];

const nodeToneClasses = {
  signal: "border-signal-200 bg-signal-50/60 text-signal-700",
  success: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
};

function StageNodes({ nodes, tone }: { nodes: JourneyNode[]; tone: JourneyStage["tone"] }) {
  return (
    <div className="mt-8 grid grid-cols-[auto_1fr_auto_1fr_auto] items-start">
      {nodes.map(({ icon: Icon, label }, index) => (
        <div className="contents" key={label}>
          <div className="relative z-10 flex flex-col items-center bg-white px-1 text-center">
            <div className={`flex size-14 items-center justify-center rounded-full border shadow-[0_10px_24px_-18px_rgba(55,48,163,0.55)] ${nodeToneClasses[tone]}`}>
              <Icon aria-hidden="true" className="size-6 stroke-[1.6]" />
            </div>
            <p className="mt-3 text-xs font-medium leading-4 text-ink">{label}</p>
          </div>
          {index < nodes.length - 1 ? (
            <span
              aria-hidden="true"
              className={`relative top-7 min-w-3 border-t border-dashed ${
                tone === "signal" ? "border-signal-400" : "border-emerald-400"
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
          className={`flex size-9 shrink-0 items-center justify-center rounded-full border bg-white font-mono text-sm font-semibold ${
            isSignal ? "border-signal-200 text-signal-700" : "border-emerald-200 text-emerald-700"
          }`}
        >
          {index + 1}
        </span>
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-ink">{stage.title}</h3>
      </div>
      <p
        className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
          isSignal
            ? "border-signal-100 bg-signal-50/60 text-signal-700"
            : "border-emerald-100 bg-emerald-50/70 text-emerald-700"
        }`}
      >
        {stage.tag}
      </p>
      <StageNodes nodes={stage.nodes} tone={stage.tone} />
      <p className="mt-8 border-t border-line pt-6 text-sm leading-6 text-slate-700">{stage.copy}</p>
      <p
        className={`mt-6 border-l-2 px-3 text-sm leading-5 ${
          isSignal ? "border-signal-500 text-slate-700" : "border-emerald-500 text-slate-700"
        }`}
      >
        {stage.note}
      </p>
    </article>
  );
}

function TodayCard() {
  return (
    <article className="rounded-3xl border border-signal-400 bg-white p-6 shadow-[0_18px_40px_-30px_rgba(55,48,163,0.45)] sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-500 bg-emerald-50 font-mono text-sm font-semibold text-emerald-700">
          4
        </span>
        <h3 className="text-2xl font-semibold tracking-[-0.04em] text-ink">Today</h3>
      </div>
      <div className="mt-8 space-y-3">
        <div className="flex items-center gap-3 rounded-2xl border border-signal-100 bg-signal-50/40 p-4 text-sm font-semibold text-signal-800">
          <Users aria-hidden="true" className="size-6 shrink-0" />
          Customer-facing products
        </div>
        <div aria-hidden="true" className="flex h-6 justify-center">
          <span className="border-l border-dashed border-signal-400" />
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm font-semibold text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="size-6 shrink-0" />
          Reliable operational workflows
        </div>
      </div>
      <p className="mt-8 border-t border-line pt-6 text-sm leading-6 text-slate-700">
        That broader view shapes how I build today.
      </p>
    </article>
  );
}

export function AboutJourneySection() {
  return (
    <section aria-labelledby="about-journey-heading" className="pb-20 pt-8 sm:pb-28 sm:pt-12">
      <Container>
        <div className="max-w-4xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-signal-700">
            How I got here
          </p>
          <h2
            className="mt-5 text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-ink sm:text-5xl lg:text-6xl"
            id="about-journey-heading"
          >
            From the interface to the full <span className="text-signal-600">journey</span>
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700 sm:text-xl">
            My focus broadened from building customer-facing products to understanding the systems
            and operations that make them work.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-4 xl:gap-7">
          {stages.map((stage, index) => (
            <JourneyCard index={index} key={stage.title} stage={stage} />
          ))}
          <TodayCard />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-full border border-line bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-soft">
          <span className="text-signal-700">Product</span>
          <span aria-hidden="true" className="text-signal-300">→</span>
          <span className="text-emerald-700">Operations</span>
          <span aria-hidden="true" className="text-signal-300">→</span>
          <span className="text-signal-700">Systems</span>
          <span aria-hidden="true" className="text-signal-300">→</span>
          <span className="text-signal-700">Current focus</span>
        </div>
      </Container>
    </section>
  );
}
