import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Bot,
  Mail,
  MessageCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";

type CaseStudyLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

export function CaseBadge({
  children,
  tone = "signal",
}: {
  children: ReactNode;
  tone?: "signal" | "success";
}) {
  const toneClasses =
    tone === "success"
      ? "border-success-100 bg-success-50 text-success-700"
      : "border-signal-100 bg-signal-50 text-signal-700";

  return (
    <p
      className={`inline-flex w-fit max-w-full self-start items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${toneClasses}`}
    >
      {children}
    </p>
  );
}

export function StudyLink({ href, icon: Icon, label }: CaseStudyLink) {
  return (
    <a
      className="inline-flex items-center gap-2 text-sm font-semibold text-signal-700 transition hover:text-signal-900"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
      {label}
      <ArrowUpRight aria-hidden="true" className="size-4" />
    </a>
  );
}

export function StudyPoint({
  children,
  compact = false,
  icon: Icon,
  title,
  tone = "signal",
}: {
  children: ReactNode;
  compact?: boolean;
  icon: LucideIcon;
  title: string;
  tone?: "signal" | "success";
}) {
  const toneClasses =
    tone === "success"
      ? "border-success-100 bg-success-50 text-success-700"
      : "border-signal-100 bg-signal-50 text-signal-700";

  if (compact) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${toneClasses}`}>
            <Icon aria-hidden="true" className="size-3.5" />
          </span>
          <h4 className="text-sm font-semibold text-ink">{title}</h4>
        </div>
        <div className="mt-1.5 text-xs leading-5 text-slate-700">{children}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-3">
      <span className={`flex size-10 items-center justify-center rounded-full border ${toneClasses}`}>
        <Icon aria-hidden="true" className="size-4.5" />
      </span>
      <div>
        <h4 className="font-semibold text-ink">{title}</h4>
        <div className="mt-1 text-sm leading-6 text-slate-700">{children}</div>
      </div>
    </div>
  );
}

export function PortfolioAssistantPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[18rem] rounded-2xl border border-signal-100 bg-signal-50/40 p-4 shadow-[0_16px_36px_-26px_rgba(55,48,163,0.7)]">
      <div className="flex items-center gap-2 text-xs font-semibold text-signal-900">
        <span className="flex size-7 items-center justify-center rounded-full bg-white text-signal-700 shadow-sm">
          <Sparkles aria-hidden="true" className="size-4" />
        </span>
        Portfolio Assistant
      </div>
      <div className="mt-4 space-y-3 text-[11px] leading-4">
        <p className="max-w-[85%] rounded-xl rounded-tl-sm bg-white p-3 text-slate-700 shadow-sm">
          Ask me anything about my work, experience or how I can help.
        </p>
        <p className="ml-auto max-w-[78%] rounded-xl rounded-tr-sm bg-signal-600 p-3 text-white">
          What kind of products do you work on?
        </p>
        <p className="max-w-[88%] rounded-xl rounded-tl-sm bg-white p-3 text-slate-700 shadow-sm">
          Customer-facing products and the operational systems behind them.
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg border border-signal-100 bg-white px-3 py-2 text-[10px] text-slate-400">
        Ask a question…
        <MessageCircle aria-hidden="true" className="size-3.5 text-signal-500" />
      </div>
    </div>
  );
}

const emailSteps = [
  [Mail, "Detect", "Find relevant emails"],
  [Bot, "Understand", "Interpret important changes"],
  [TrendingUp, "Update state", "Keep information in sync"],
  [Sparkles, "Surface what matters", "Show the important updates"],
] as const;

export function EmailWorkflowPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[18rem] space-y-2 py-2">
      <span aria-hidden="true" className="absolute bottom-8 left-6 top-8 border-l border-dashed border-success-300" />
      {emailSteps.map(([Icon, title, copy]) => (
        <div
          className="relative flex items-center justify-center rounded-xl border border-success-100 bg-white p-2 shadow-[0_12px_28px_-24px_rgba(4,120,87,0.7)] sm:grid sm:grid-cols-[2rem_1fr] sm:justify-start sm:gap-2"
          key={title}
          title={`${title}: ${copy}`}
        >
          <span className="z-10 flex size-8 items-center justify-center rounded-full border border-success-100 bg-success-50 text-success-700">
            <Icon aria-hidden="true" className="size-4" />
          </span>
          <span className="hidden min-w-0 sm:block">
            <strong className="block text-xs text-ink">{title}</strong>
            <span className="mt-0.5 hidden text-[10px] text-slate-500 sm:block">{copy}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
