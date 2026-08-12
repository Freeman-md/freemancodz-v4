import { CircleAlert, Folder, Sparkles, UserRound } from "lucide-react";

import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { PortfolioIcon } from "@/features/portfolio/components/PortfolioIcon";
import type {
  AuditPresentationData,
  PortfolioIcon as PortfolioIconModel,
} from "@/features/portfolio/models/portfolio-presentation";

function Symptom({
  iconName,
  label,
  index,
}: {
  iconName: PortfolioIconModel["iconName"];
  label: string;
  index: number;
}) {
  return (
    <div
      className={`flex min-h-28 flex-col items-center justify-center px-2 text-center sm:min-h-36 sm:px-3 ${
        index < 4 ? "border-b border-line" : ""
      } ${index % 2 === 0 ? "border-r border-line" : ""} lg:border-r-0 lg:border-b-0 ${
        index % 3 === 2 ? "" : "lg:border-r lg:border-line"
      } ${index < 3 ? "lg:border-b lg:border-line" : ""}`}
    >
      <div className="flex size-11 items-center justify-center rounded-full border border-red-100 bg-red-50/60 text-red-500 shadow-[0_8px_20px_-14px_rgba(220,38,38,0.6)]">
        <PortfolioIcon aria-hidden="true" className="size-5 stroke-[1.8]" name={iconName} />
      </div>
      <p className="mt-2 max-w-32 text-sm font-medium leading-5 text-slate-900 sm:mt-3 sm:max-w-48 sm:text-base">
        {label}
      </p>
    </div>
  );
}

export function AuditSymptomsSection({ symptoms }: Pick<AuditPresentationData, "symptoms">) {
  return (
    <section aria-labelledby="audit-symptoms-heading" className="py-16 sm:py-20">
      <Container>
        <MarketingSectionHeading
          copy={<p>{symptoms.copy}</p>}
          eyebrow={symptoms.eyebrow}
          id="audit-symptoms-heading"
          title={symptoms.title}
        />

        <div className="mt-12 overflow-hidden rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7 lg:p-10">
          <div className="grid grid-cols-2 border-t border-line lg:grid-cols-3">
            {symptoms.icons.map((symptom, index) => (
              <Symptom {...symptom} index={index} key={symptom.label} />
            ))}
          </div>

          <div className="border-t border-line pt-8 sm:pt-10">
            <div className="flex w-full flex-col items-center gap-7 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-8">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-signal-100 bg-signal-50/50 text-signal-800 shadow-[0_8px_22px_-16px_rgba(67,56,202,0.55)]">
                  <UserRound aria-hidden="true" className="size-7 stroke-[1.7]" />
                </div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-signal-900">
                  Customer journey
                </p>
              </div>

              <div className="relative z-10 flex size-40 shrink-0 flex-col items-center justify-center rounded-full border border-red-200 bg-white px-5 text-center motion-safe:animate-alert-glow sm:size-44">
                <CircleAlert aria-hidden="true" className="size-8 text-red-500" />
                <p className="mt-2 text-xl font-medium leading-6 text-slate-900">
                  Underlying disconnect
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 text-center sm:flex-row-reverse sm:text-right">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-signal-100 bg-signal-50/50 text-signal-800 shadow-[0_8px_22px_-16px_rgba(67,56,202,0.55)]">
                  <Folder aria-hidden="true" className="size-7 stroke-[1.7]" />
                </div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-signal-900">
                  Operational workflow
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4 border-t border-line pt-6 text-signal-700 sm:mt-10">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-signal-100 bg-signal-50/50">
              <Sparkles aria-hidden="true" className="size-5" />
            </div>
            <p className="text-base leading-6 sm:text-lg">
              The audit helps identify where the friction lives before deciding what should change.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
