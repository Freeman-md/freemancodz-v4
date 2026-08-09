import type { LucideIcon } from "lucide-react";
import {
  CircleCheck,
  Clock3,
  Folder,
  Inbox,
  MessageCircleQuestion,
  MessageSquareCheck,
  NotebookPen,
  Send,
  UserRound,
} from "lucide-react";

import { Container } from "@/shared/components/layout/Container";

type WorkflowNodeData = {
  icon: LucideIcon;
  label: string;
};

const beforeCustomerJourney: WorkflowNodeData[] = [
  { icon: Send, label: "Enquiry sent" },
  { icon: Clock3, label: "Waits" },
  { icon: MessageCircleQuestion, label: "Unclear next step" },
];

const beforeOperationalWorkflow: WorkflowNodeData[] = [
  { icon: Inbox, label: "Shared inbox" },
  { icon: UserRound, label: "Manual handoff" },
  { icon: Clock3, label: "Delayed follow-up" },
];

const afterCustomerJourney: WorkflowNodeData[] = [
  { icon: NotebookPen, label: "Right info once" },
  { icon: MessageSquareCheck, label: "Knows what happens next" },
];

const afterOperationalWorkflow: WorkflowNodeData[] = [
  { icon: Folder, label: "Right place" },
  { icon: UserRound, label: "Clear owner" },
  { icon: CircleCheck, label: "Timely update" },
];

function WorkflowNode({
  icon: Icon,
  label,
  tone,
}: WorkflowNodeData & { tone: "before" | "after" }) {
  const isAfter = tone === "after";

  return (
    <div className="relative z-10 flex min-w-0 flex-1 flex-col items-center text-center">
      <div
        className={`flex size-16 items-center justify-center rounded-full border bg-white sm:size-[72px] ${
          isAfter
            ? "border-emerald-300 text-emerald-700 motion-safe:animate-success-glow"
            : "border-red-300 text-ink motion-safe:animate-alert-glow"
        }`}
      >
        <Icon aria-hidden="true" className="size-7 stroke-[1.75] sm:size-8" />
      </div>
      <p className="mt-3 max-w-[10rem] text-sm font-medium leading-5 text-ink sm:text-base">{label}</p>
    </div>
  );
}

function WorkflowPanel({
  title,
  nodes,
  tone,
}: {
  title: string;
  nodes: WorkflowNodeData[];
  tone: "before" | "after";
}) {
  const connectorClass = tone === "after" ? "border-emerald-600" : "border-slate-400";

  const connectorStyle = tone === "after" ? "border-solid" : "border-dashed";

  return (
    <section>
      <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
        {title}
      </h3>
      <div className={`mt-7 flex items-start gap-3 sm:gap-4 ${
        tone === "after" && nodes.length === 3 ? "md:gap-7" : ""
      }`}>
        {nodes.map((node, index) => (
          <div className="contents" key={node.label}>
            <WorkflowNode {...node} tone={tone} />
            {index < nodes.length - 1 ? (
              <div
                aria-hidden="true"
                className={`relative top-8 hidden min-w-6 flex-1 border-t-2 sm:block ${
                  tone === "after" && nodes.length === 3 ? "md:min-w-10" : ""
                } ${connectorClass} ${connectorStyle}`}
              >
                {tone === "after" ? (
                  <span className="absolute -right-1.5 -top-1.5 size-3 rounded-full bg-emerald-600" />
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function ComparisonCard({ tone }: { tone: "before" | "after" }) {
  const isAfter = tone === "after";

  const customerJourney = isAfter ? afterCustomerJourney : beforeCustomerJourney;

  const operationalWorkflow = isAfter ? afterOperationalWorkflow : beforeOperationalWorkflow;

  return (
    <article
      className={`rounded-3xl border bg-white p-5 shadow-soft transition duration-300 motion-safe:hover:-translate-y-1 sm:p-6 ${
        isAfter
          ? "border-emerald-100 shadow-[0_16px_42px_-30px_rgba(21,128,61,0.42)] motion-safe:hover:shadow-[0_20px_48px_-28px_rgba(21,128,61,0.34)]"
          : "border-line motion-safe:hover:shadow-[0_20px_48px_-28px_rgba(185,28,28,0.22)]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-2 pb-6">
        <p
          className={`rounded-full px-5 py-2 font-mono text-base font-semibold uppercase tracking-[0.16em] sm:text-lg ${
            isAfter ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {isAfter ? "After" : "Before"}
        </p>
        <p className="text-base font-medium text-ink sm:text-lg">
          {isAfter ? "Clear. Connected. Reliable." : "Slow. Unclear. Manual."}
        </p>
      </div>

      <div
        className={`overflow-hidden rounded-2xl border ${
          isAfter ? "border-emerald-100" : "border-line"
        }`}
      >
        <div className="p-5 sm:p-6">
          <WorkflowPanel
            nodes={customerJourney}
            title="Customer-facing journey"
            tone={tone}
          />
        </div>
        <div className={`border-t p-5 sm:p-6 ${isAfter ? "border-emerald-100" : "border-line"}`}>
          <WorkflowPanel
            nodes={operationalWorkflow}
            title="Operational workflow"
            tone={tone}
          />
        </div>
      </div>
    </article>
  );
}

export function BeforeAfterSection() {
  return (
    <section aria-labelledby="friction-heading" className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-700 sm:text-xs">
            Before &amp; after
          </p>
          <h2
            className="mt-5 font-display text-4xl leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl md:text-6xl"
            id="friction-heading"
          >
            Where the friction hides
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-7 text-slate-700 sm:text-xl">
            Same customer action. Very different experience behind the scenes.
          </p>
        </div>

        <div className="mt-12 grid gap-7 lg:grid-cols-2 lg:gap-8">
          <ComparisonCard tone="before" />
          <ComparisonCard tone="after" />
        </div>
      </Container>
    </section>
  );
}
