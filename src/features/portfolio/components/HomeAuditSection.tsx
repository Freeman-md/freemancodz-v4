import Link from "next/link";
import { ArrowDown, ArrowRight, Check, FileText } from "lucide-react";

import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import type { PortfolioIcon as PortfolioIconModel } from "../models/portfolio-presentation";
import type {
  HomePresentationData,
  PortfolioSection,
} from "../models/portfolio-presentation";
import { PortfolioAction } from "./PortfolioAction";
import { PortfolioIcon } from "./PortfolioIcon";

function AuditFlow({
  steps,
  tone,
}: {
  steps: PortfolioIconModel[];
  tone: "problem" | "improvement";
}) {
  const isProblem = tone === "problem";

  return (
    <div
      className="mt-7 grid gap-3 md:grid-cols-[repeat(var(--steps),minmax(0,1fr))] md:gap-0"
      style={{ "--steps": steps.length } as React.CSSProperties}
    >
      {steps.map(({ iconName, label }, index) => {
        const emphasis = tone === "problem" && label === "Manual check";

        return (
          <div
            className="relative grid grid-cols-[3.5rem_1fr] items-center gap-3 md:flex md:flex-col md:text-center"
            key={label}
          >
            {index > 0 ? (
              <span
                aria-hidden="true"
                className={`absolute -left-3 top-7 hidden h-px w-6 md:block ${isProblem ? "bg-signal-200" : "bg-success-300"}`}
              />
            ) : null}
            <span
              className={`relative z-10 flex size-14 items-center justify-center rounded-xl border bg-white shadow-soft ${emphasis
                ? "border-red-300 text-red-600 shadow-[0_0_30px_rgba(239,68,68,0.16)]"
                : isProblem
                  ? "border-signal-100 text-signal-600"
                  : "border-success-100 text-success-700"
                }`}
            >
              <PortfolioIcon
                aria-hidden="true"
                className="size-6"
                name={iconName}
                strokeWidth={1.7}
              />
            </span>
            <span
              className={`text-sm font-medium leading-5 ${emphasis ? "text-red-600" : "text-slate-950"}`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AuditDiagram({
  improvement,
  problem,
}: Pick<HomePresentationData["audit"], "improvement" | "problem">) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-white shadow-soft lg:row-span-2">
      <div className="border-b border-line p-6 sm:p-8 lg:p-10">
        <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase text-red-600">
          The problem
        </span>
        <h3 className="mt-4 max-w-md text-2xl font-semibold tracking-[-0.04em] text-slate-950">
          {problem.title}
        </h3>
        <AuditFlow steps={problem.icons} tone="problem" />
        <div className="mt-7 rounded-xl border border-red-200 bg-red-50/45 p-5 md:ml-auto md:max-w-sm">
          <p className="text-xs font-bold uppercase text-red-600">Main friction</p>
          <p className="mt-2 text-sm leading-6 text-slate-800">{problem.copy}</p>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 z-20 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-signal-100 bg-white text-signal-600 shadow-soft mt-12 md:mt-3">
        <ArrowDown aria-hidden="true" className="size-7" />
      </div>

      <div className="p-6 pt-10 sm:p-8 sm:pt-12 lg:p-10 lg:pt-12">
        <span className="inline-flex rounded-full bg-success-50 px-3 py-1 text-xs font-bold uppercase text-success-700">
          The improvement
        </span>
        <h3 className="mt-4 max-w-md text-2xl font-semibold tracking-[-0.04em] text-slate-950">
          {improvement.title}
        </h3>
        <AuditFlow steps={improvement.icons} tone="improvement" />
        <div className="mt-7 rounded-xl border border-success-100 bg-success-50/45 p-5 md:ml-auto md:max-w-sm">
          <p className="text-xs font-bold uppercase text-success-700">First improvement</p>
          <p className="mt-2 text-sm leading-6 text-slate-800">{improvement.copy}</p>
        </div>
      </div>
    </div>
  );
}

function AuditAction({ audit }: { audit: PortfolioSection }) {
  return (
    <div className="flex flex-col justify-end">
      <div className="hidden space-y-6 lg:block">
        {audit.icons.map((item) => (
          <div className="flex gap-5" key={item.label}>
            <PortfolioIcon
              aria-hidden="true"
              className="mt-1 size-8 shrink-0 text-signal-600"
              name={item.iconName}
            />
            <p className="text-base leading-7 text-slate-700">
              <strong className="text-slate-950">{item.label}</strong>
              {item.copy ? ` ${item.copy}` : ""}
            </p>
          </div>
        ))}
      </div>

      {audit.actions.map((action) => (
        <PortfolioAction action={action} className="mt-8 max-w-none lg:mt-10" key={action.label} />
      ))}
      <p className="mt-5 flex items-center justify-center gap-2 text-center text-sm text-slate-600 lg:justify-start">
        <Check
          aria-hidden="true"
          className="size-5 rounded-full bg-signal-50 p-1 text-signal-700"
        />
        Personally reviewed · Delivered within 48 hours
      </p>
      <div className="mt-7 rounded-2xl border border-signal-100 bg-signal-50/40 p-5 text-sm leading-6 text-slate-700">
        <div className="flex gap-4">
          <FileText aria-hidden="true" className="mt-1 size-6 shrink-0 text-signal-600" />
          <p>
            The full Audit page explains exactly what’s reviewed and what you receive.
            <Link
              className="mt-2 flex items-center gap-2 font-semibold text-signal-700"
              href="/audit"
            >
              See the full details <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function HomeAuditSection({ audit }: Pick<HomePresentationData, "audit">) {
  return (
    <section className="bg-white px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto grid max-w-[1360px] gap-10 lg:grid-cols-[0.38fr_0.62fr] lg:grid-rows-[auto_1fr] lg:gap-x-16">
        <MarketingSectionHeading
          align="left"
          eyebrow={audit.eyebrow}
          id="home-audit-heading"
          title={audit.title}
        />
        <AuditDiagram improvement={audit.improvement} problem={audit.problem} />
        <AuditAction audit={audit} />
      </div>
    </section>
  );
}
