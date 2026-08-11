import type { LucideIcon } from "lucide-react";
import {
  Lightbulb,
  CircleCheck,
  Download,
  GitBranch,
  MousePointer2,
  Network,
  Puzzle,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Container } from "@/shared/components/layout/Container";
import { siteAssetLinks } from "@/shared/config/links";

type JourneyStep = {
  icon: LucideIcon;
  label: string;
};

const customerSteps: JourneyStep[] = [
  { icon: Search, label: "Find" },
  { icon: Lightbulb, label: "Understand" },
  { icon: MousePointer2, label: "Act" },
];

const workflowSteps: JourneyStep[] = [
  { icon: Download, label: "Capture" },
  { icon: GitBranch, label: "Route" },
  { icon: CircleCheck, label: "Complete" },
];

const principles: JourneyStep[] = [
  { icon: Users, label: "User outcomes" },
  { icon: Network, label: "Systems thinking" },
  { icon: ShieldCheck, label: "Reliability by design" },
  { icon: Puzzle, label: "Practical integration" },
];

function JourneyRail({
  label,
  steps,
  tone,
}: {
  label: string;
  steps: JourneyStep[];
  tone: "signal" | "success";
}) {
  const colors =
    tone === "signal"
      ? "border-signal-100 bg-signal-50/40 text-signal-800"
      : "border-success-100 bg-success-50/50 text-success-700";

  return (
    <section className={`rounded-3xl border bg-white/80 p-5 shadow-soft ${colors.split(" ")[0]}`}>
      <p className={`text-center font-mono text-[10px] font-semibold uppercase tracking-[0.15em] ${colors.split(" ").slice(2).join(" ")}`}>
        {label}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-5">
        {steps.map(({ icon: Icon, label: stepLabel }, index) => (
          <div className="relative flex flex-col items-center text-center" key={stepLabel}>
            {index > 0 ? (
              <span
                aria-hidden="true"
                className={`absolute -left-1/2 top-7 hidden h-px w-full lg:-top-5 lg:left-1/2 lg:block lg:h-5 lg:w-px ${
                  tone === "signal" ? "bg-signal-200" : "bg-success-200"
                }`}
              />
            ) : null}
            <div className={`relative z-10 flex size-14 items-center justify-center rounded-full border ${colors}`}>
              <Icon aria-hidden="true" className="size-6 stroke-[1.6]" />
            </div>
            <p className="mt-2 text-xs font-medium text-ink">{stepLabel}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PortraitSignal() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex size-44 items-center justify-center rounded-full border border-signal-300 bg-signal-50/50 p-3 motion-safe:animate-signal-glow sm:size-52 lg:size-60">
        <div className="size-full overflow-hidden rounded-full border-4 border-white bg-surface shadow-[0_14px_34px_-22px_rgba(55,48,163,0.8)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Freeman Madudili"
            className="size-full object-cover grayscale transition duration-500 hover:grayscale-0"
            src={siteAssetLinks.heroImage}
          />
        </div>
      </div>
    </div>
  );
}

export function AboutHero() {
  return (
    <Container>
      <section className="py-16 sm:py-20 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(34rem,1.05fr)] lg:gap-12">
          <div className="max-w-2xl lg:max-w-xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-signal-800">
              Software engineer
            </p>
            <h1 className="mt-8 text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-ink sm:text-6xl lg:text-6xl">
              I build software around the moments where people need{" "}
              <span className="text-signal-600">something to happen.</span>
            </h1>
            <span aria-hidden="true" className="mt-8 block h-1 w-14 rounded-full bg-signal-500" />
            <div className="mt-9 max-w-xl space-y-5 text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
              <p>
                I&apos;m Freeman Madudili, a software engineer focused on{" "}
                <span className="font-medium text-signal-700">customer-facing products</span> and the
                operational <span className="font-medium text-signal-700">workflows</span> behind them.
              </p>
              <p>
                I care about making software clear and useful for the people using it, while making
                the systems behind that experience reliable and practical to operate.
              </p>
            </div>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-[minmax(8rem,0.75fr)_auto_minmax(8rem,0.75fr)] lg:gap-6">
            <JourneyRail label="Customer / user side" steps={customerSteps} tone="signal" />
            <div className="flex justify-center py-2 lg:py-0">
              <PortraitSignal />
            </div>
            <JourneyRail label="System / workflow side" steps={workflowSteps} tone="success" />
          </div>
        </div>

        <div className="mt-14 grid overflow-hidden rounded-3xl border border-line bg-white shadow-soft grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {principles.map(({ icon: Icon, label }, index) => (
            <article
              className={`flex items-center gap-4 p-5 sm:p-6 ${
                index < principles.length - 1 ? "border-b border-line lg:border-b-0 lg:border-r" : ""
              } ${index === 1 ? "sm:border-b sm:border-r lg:border-r" : ""}`}
              key={label}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-signal-100 bg-signal-50/50 text-signal-700">
                <Icon aria-hidden="true" className="size-5 stroke-[1.7]" />
              </div>
              <p className="text-sm font-semibold leading-5 tracking-[-0.02em] text-ink">{label}</p>
            </article>
          ))}
        </div>
      </section>
    </Container>
  );
}
