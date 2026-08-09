import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Brain,
  CircleAlert,
  Clock3,
  Copy,
  Folder,
  MessageCircleQuestion,
  Repeat2,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Container } from "@/shared/components/layout/Container";

const symptoms: { icon: LucideIcon; label: string }[] = [
  { icon: MessageCircleQuestion, label: "Repeated questions" },
  { icon: Clock3, label: "Slow responses" },
  { icon: Repeat2, label: "Repeated follow-up" },
  { icon: Copy, label: "Copying info" },
  { icon: ArrowLeftRight, label: "Lost handoffs" },
  { icon: Brain, label: "Someone has to remember the next step" },
];

function Symptom({
  icon: Icon,
  label,
  index,
}: {
  icon: LucideIcon;
  label: string;
  index: number;
}) {
  return (
    <div
      className={`flex min-h-32 flex-col items-center justify-center px-3 text-center sm:min-h-36 ${
        index < symptoms.length - 1 ? "border-b border-line" : ""
      } ${index % 3 === 2 ? "" : "lg:border-r lg:border-line"} ${
        index < 3 ? "lg:border-b lg:border-line" : "lg:border-b-0"
      }`}
    >
      <div className="flex size-11 items-center justify-center rounded-full border border-red-100 bg-red-50/60 text-red-500 shadow-[0_8px_20px_-14px_rgba(220,38,38,0.6)]">
        <Icon aria-hidden="true" className="size-5 stroke-[1.8]" />
      </div>
      <p className="mt-3 max-w-48 text-base font-medium leading-5 text-slate-900">{label}</p>
    </div>
  );
}

export function AuditSymptomsSection() {
  return (
    <section aria-labelledby="audit-symptoms-heading" className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-5xl text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-700 sm:text-xs">
            Why this audit exists
          </p>
          <h2
            className="mt-5 font-display text-4xl leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl md:text-6xl"
            id="audit-symptoms-heading"
          >
            You usually notice the symptoms first
          </h2>
          <p className="mx-auto mt-5 max-w-4xl text-lg leading-7 text-slate-700 sm:text-xl">
            Small issues often point to deeper friction between the customer journey and the
            workflow behind it.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7 lg:p-10">
          <div className="grid grid-cols-1 border-t border-line lg:grid-cols-3">
            {symptoms.map((symptom, index) => (
              <Symptom {...symptom} index={index} key={symptom.label} />
            ))}
          </div>

          <div className="border-t border-line pt-8 sm:pt-10">
            <div className="grid items-center gap-7 sm:grid-cols-[1fr_auto_1fr] sm:gap-8">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50/50 text-indigo-800 shadow-[0_8px_22px_-16px_rgba(67,56,202,0.55)]">
                  <UserRound aria-hidden="true" className="size-7 stroke-[1.7]" />
                </div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-indigo-950">
                  Customer journey
                </p>
              </div>

              <div className="relative flex size-40 shrink-0 flex-col items-center justify-center rounded-full border border-red-200 bg-white px-5 text-center shadow-[0_0_28px_rgba(248,113,113,0.28),0_0_60px_rgba(254,202,202,0.5)] sm:size-44">
                <CircleAlert aria-hidden="true" className="size-8 text-red-500" />
                <p className="mt-2 text-xl font-medium leading-6 text-slate-900">Underlying disconnect</p>
              </div>

              <div className="flex flex-col items-center gap-4 text-center sm:flex-row-reverse sm:text-right">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50/50 text-indigo-800 shadow-[0_8px_22px_-16px_rgba(67,56,202,0.55)]">
                  <Folder aria-hidden="true" className="size-7 stroke-[1.7]" />
                </div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-indigo-950">
                  Operational workflow
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4 border-t border-line pt-6 text-indigo-700 sm:mt-10">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50/50">
              <Sparkles aria-hidden="true" className="size-5" />
            </div>
            <p className="text-base leading-6 sm:text-lg">
              The audit helps identify where the friction lives before deciding what should
              change.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
