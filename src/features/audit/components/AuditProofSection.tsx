import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import {
  Archive,
  ArrowUpRight,
  Check,
  CreditCard,
  Filter,
  Globe2,
  Mail,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { buttonVariants } from "@/shared/components/ui/Button";
import {
  projectVisualNameSchema,
  type ProjectVisualName,
} from "@/contracts/portfolio-presentation.contract";
import type { AuditPresentationData } from "@/features/portfolio/models/portfolio-presentation";

type ProofNodeData = {
  icon: LucideIcon;
  label: string;
};

function ProofBadge({ children }: { children: string }) {
  return (
    <p className="inline-flex rounded-full border border-signal-100 bg-signal-50/70 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-signal-800">
      {children}
    </p>
  );
}

function ProofNode({ icon: Icon, label }: ProofNodeData) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-2 bg-white px-1 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-signal-200 bg-signal-50/50 text-signal-800 shadow-[0_8px_22px_-16px_rgba(55,48,163,0.6)]">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <span className="whitespace-nowrap text-[11px] font-medium text-slate-700 sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function Pay4MeVisual() {
  return (
    <div className="mt-8 rounded-2xl border border-line p-4 sm:p-5">
      <div className="grid grid-cols-[auto_minmax(1rem,1fr)_auto_minmax(1rem,1fr)_auto] items-start">
        <ProofNode icon={UserRound} label="Customer" />
        <FlowConnector />
        <ProofNode icon={CreditCard} label="Payment" />
        <FlowConnector />
        <ProofNode icon={Globe2} label="Global payout" />
      </div>
    </div>
  );
}

function FlowConnector({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`relative top-6 min-w-2 border-t border-dashed border-signal-400 motion-safe:animate-signal-flow ${className ?? ""}`}
    >
      <span className="absolute -left-0.5 -top-1 size-2 rounded-full bg-signal-500" />
      <span className="absolute -right-0.5 -top-1 size-2 rounded-full bg-signal-500" />
    </div>
  );
}

function PortfolioAssistantVisual() {
  return (
    <>
      <div className="mt-8 flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-signal-200 bg-signal-50/50 text-signal-800">
          <Sparkles aria-hidden="true" className="size-5" />
        </div>
        <div
          aria-label="Guidance response loading"
          className="flex min-h-16 flex-1 flex-col justify-center gap-2 overflow-hidden rounded-xl border border-signal-100 bg-white px-4 shadow-[0_8px_20px_-18px_rgba(55,48,163,0.45)]"
          role="status"
        >
          <span className="h-2 w-4/5 rounded-full bg-[linear-gradient(90deg,#e5e7eb_20%,#f8fafc_50%,#e5e7eb_80%)] bg-[length:200%_100%] motion-safe:animate-skeleton-shimmer" />
          <span className="h-2 w-[92%] rounded-full bg-[linear-gradient(90deg,#e5e7eb_20%,#f8fafc_50%,#e5e7eb_80%)] bg-[length:200%_100%] motion-safe:animate-skeleton-shimmer" />
          <span className="h-2 w-3/5 rounded-full bg-[linear-gradient(90deg,#e5e7eb_20%,#f8fafc_50%,#e5e7eb_80%)] bg-[length:200%_100%] motion-safe:animate-skeleton-shimmer" />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {["Understand", "Compare", "Next step"].map((label) => (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-signal-100 bg-signal-50/40 px-3 py-1.5 text-xs font-medium text-signal-800"
            key={label}
          >
            <Check aria-hidden="true" className="size-3.5" />
            {label}
          </span>
        ))}
      </div>
    </>
  );
}

function EmailWorkflowVisual() {
  const actions: ProofNodeData[] = [
    { icon: UserRound, label: "Respond" },
    { icon: UsersRound, label: "Delegate" },
    { icon: Archive, label: "Archive" },
  ];

  return (
    <div className="relative mt-8 rounded-2xl border border-line p-4 sm:p-5">
      <div className="grid grid-cols-[auto_minmax(2rem,1fr)_auto] items-start">
        <ProofNode icon={Mail} label="Inbox" />
        <FlowConnector />
        <ProofNode icon={Filter} label="Triage" />
      </div>
      <div className="relative mt-6 border-t border-dashed border-signal-300 pt-7">
        <svg
          aria-hidden="true"
          className="absolute left-[16%] top-0 h-10 w-[68%] text-signal-300"
          fill="none"
          viewBox="0 0 260 44"
        >
          <path
            d="M130 0V14M130 14H36M130 14H224M36 14V42M130 14V42M224 14V42"
            stroke="currentColor"
            strokeDasharray="4 5"
            strokeWidth="1.25"
          />
          <circle cx="36" cy="42" fill="currentColor" r="3" />
          <circle cx="130" cy="42" fill="currentColor" r="3" />
          <circle cx="224" cy="42" fill="currentColor" r="3" />
        </svg>
        <div className="grid grid-cols-3 gap-2 pt-9">
          {actions.map((action) => (
            <ProofNode {...action} key={action.label} />
          ))}
        </div>
      </div>
    </div>
  );
}

export const projectVisualRegistry = {
  EmailWorkflowVisual,
  Pay4MeVisual,
  PortfolioAssistantVisual,
} satisfies Record<ProjectVisualName, ComponentType>;

export function resolveProjectVisual(value: string | null): ComponentType | null {
  const parsed = projectVisualNameSchema.safeParse(value);

  return parsed.success ? projectVisualRegistry[parsed.data] : null;
}

function ProofLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      aria-label={`Open ${label}`}
      className={buttonVariants({
        className: "absolute right-6 top-6 rounded-full",
        size: "icon",
        variant: "outline",
      })}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <ArrowUpRight aria-hidden="true" className="size-4" />
    </a>
  );
}

export function AuditProofSection({
  projects,
  proof,
}: Pick<AuditPresentationData, "projects" | "proof">) {
  return (
    <section
      aria-labelledby="audit-proof-heading"
      className="py-16 sm:py-20"
      id="audit-proof"
    >
      <Container>
        <MarketingSectionHeading
          copy={<p>{proof.copy}</p>}
          eyebrow={proof.eyebrow}
          id="audit-proof-heading"
          title={proof.title}
        />

        <div className="mt-12 overflow-hidden rounded-3xl border border-line bg-white shadow-soft lg:grid lg:grid-cols-3 lg:divide-x lg:divide-line">
          {projects.map((project, index) => {
            const Visual = resolveProjectVisual(project.visualBlock);

            return (
              <article
                className={
                  index === 0
                    ? "relative p-6 sm:p-8"
                    : "relative border-t border-line p-6 sm:p-8 lg:border-t-0"
                }
                key={project.slug}
              >
                <ProofLink href={project.externalLinks[0] ?? "#"} label={project.title} />
                <ProofBadge>{project.category}</ProofBadge>
                <h3 className="mt-6 font-display text-3xl tracking-[-0.035em] text-signal-900">
                  {project.title}
                </h3>
                <p className="mt-3 max-w-xs text-base leading-6 text-slate-700">
                  {project.visualText}
                </p>
                {Visual ? <Visual /> : null}
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
