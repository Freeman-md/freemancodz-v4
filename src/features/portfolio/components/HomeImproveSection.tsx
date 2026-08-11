import {
  Lightbulb,
  CheckCircle2,
  Download,
  GitBranch,
  MoveHorizontal,
  MoveVertical,
  Scale,
  Search,
  MousePointer2,
  Settings,
  UsersRound,
} from "lucide-react";

import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";

const customerSteps = [
  { icon: Search, label: "Find" },
  { icon: Lightbulb, label: "Understand" },
  { icon: Scale, label: "Decide" },
  { icon: MousePointer2, label: "Act", active: true },
];

const workflowSteps = [
  { icon: Download, label: "Capture" },
  { icon: GitBranch, label: "Route" },
  { icon: Scale, label: "Decide" },
  { icon: CheckCircle2, label: "Complete" },
];

type JourneyStep = (typeof customerSteps)[number];

function JourneySteps({ steps }: { steps: JourneyStep[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center sm:gap-0">
      {steps.map(({ active, icon: Icon, label }, index) => (
        <div className="contents" key={label}>
          <div
            className={`flex min-h-32 flex-col items-center justify-center gap-4 rounded-2xl border bg-white px-2 text-center shadow-[0_18px_38px_-30px_rgba(30,64,175,0.55)] sm:min-h-36 ${
              active ? "border-signal-500" : "border-signal-100"
            }`}
          >
            <Icon aria-hidden="true" className="size-8 text-signal-600 sm:size-10" strokeWidth={1.65} />
            <span className="text-sm font-medium text-slate-950 sm:text-base">{label}</span>
          </div>
          {index < steps.length - 1 ? (
            <span aria-hidden="true" className="hidden items-center sm:flex sm:w-8 lg:w-10">
              <span className="h-px flex-1 bg-signal-300" />
              <span className="size-2 rounded-full bg-signal-400" />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function JourneyPanel({
  description,
  icon: Icon,
  steps,
  title,
}: {
  description: string;
  icon: typeof UsersRound;
  steps: JourneyStep[];
  title: string;
}) {
  return (
    <div className="rounded-[2.25rem] border border-signal-100 bg-white/70 p-6 shadow-[0_26px_70px_-54px_rgba(67,56,202,0.42)] sm:p-8 lg:p-6 xl:p-8">
      <div className="mb-8 flex items-start gap-5 lg:mb-7 lg:flex-col lg:items-center lg:text-center xl:flex-row xl:items-start xl:text-left">
        <Icon aria-hidden="true" className="mt-1 size-10 shrink-0 text-signal-600" strokeWidth={1.55} />
        <div>
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-signal-700">{title}</h3>
          <p className="mt-2 text-base leading-7 text-slate-600">{description}</p>
        </div>
      </div>
      <JourneySteps steps={steps} />
    </div>
  );
}

function Handoff() {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-xl items-center justify-center py-8 lg:absolute lg:left-1/2 lg:top-1/2 lg:w-44 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:py-0">
      <span aria-hidden="true" className="absolute inset-y-0 left-1/2 border-l border-dashed border-signal-300 lg:inset-x-0 lg:inset-y-auto lg:top-1/2 lg:border-l-0 lg:border-t" />
      <div className="relative flex size-28 items-center justify-center rounded-full border border-signal-100 bg-white shadow-[0_0_0_14px_rgba(238,242,255,0.85),0_0_45px_rgba(79,70,229,0.2)] lg:size-24">
        <MoveHorizontal aria-hidden="true" className="size-10 text-signal-600 hidden xl:block" strokeWidth={1.65} />
        <MoveVertical aria-hidden="true" className="size-10 text-signal-600 block xl:hidden" strokeWidth={1.65} />
      </div>
    </div>
  );
}

export function HomeImproveSection() {
  return (
    <section className="border-b border-line bg-white px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-[1360px]">
        <MarketingSectionHeading
          copy={<p>The customer experience in front, and the workflow that keeps it moving behind the scenes.</p>}
          eyebrow="Customer journeys + workflows"
          id="home-improve-heading"
          title="What I Help Improve."
        />

        <div className="relative mt-16 lg:mt-24">
          <p className="mb-5 text-center text-sm font-semibold text-signal-700 lg:absolute lg:left-1/2 lg:top-[-3.5rem] lg:-translate-x-1/2">
            The handoff that drives outcomes
          </p>
          <div className="grid gap-0 lg:gap-10 xl:grid-cols-2 xl:gap-24">
            <JourneyPanel
              description="Help customers understand what to do and take the next step."
              icon={UsersRound}
              steps={customerSteps}
              title="Customer Journeys"
            />
            <Handoff />
            <JourneyPanel
              description="Reduce the repetitive work required to keep the process moving."
              icon={Settings}
              steps={workflowSteps}
              title="Operational Workflows"
            />
          </div>
          <div className="mx-auto mt-8 flex w-fit items-center gap-3 rounded-xl border border-signal-100 bg-white px-5 py-3 text-sm font-medium text-slate-900 shadow-soft lg:mt-14">
            <CheckCircle2 aria-hidden="true" className="size-5 text-signal-600" />
            Right action. Right next step.
          </div>
        </div>
      </div>
    </section>
  );
}
