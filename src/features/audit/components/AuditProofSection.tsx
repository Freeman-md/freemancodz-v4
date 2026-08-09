import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ArrowUpRight,
  Check,
  CreditCard,
  Filter,
  Globe2,
  Mail,
  MessageCircleMore,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Container } from "@/shared/components/layout/Container";

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
      <span className="whitespace-nowrap text-[11px] font-medium text-slate-700 sm:text-xs">{label}</span>
    </div>
  );
}

function Pay4MeVisual() {
  return (
    <div className="relative mt-8 rounded-2xl border border-line p-4 sm:p-5">
      <svg
        aria-hidden="true"
        className="absolute left-10 right-10 top-10 h-4 w-[calc(100%-5rem)] text-signal-300"
        fill="none"
        viewBox="0 0 300 16"
      >
        <path className="motion-safe:animate-signal-flow" d="M2 8H298" stroke="currentColor" strokeDasharray="5 6" strokeWidth="1.5" />
        <circle cx="2" cy="8" fill="currentColor" r="3" />
        <circle cx="150" cy="8" fill="currentColor" r="3" />
        <circle cx="298" cy="8" fill="currentColor" r="3" />
      </svg>
      <div className="relative flex justify-between">
        <ProofNode icon={UserRound} label="Customer" />
        <ProofNode icon={CreditCard} label="Payment" />
        <ProofNode icon={Globe2} label="Global payout" />
      </div>
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
        <div className="flex min-h-16 flex-1 items-center rounded-xl border border-signal-100 bg-white px-4 text-sm font-medium leading-5 text-slate-700 shadow-[0_8px_20px_-18px_rgba(55,48,163,0.45)]">
          <MessageCircleMore aria-hidden="true" className="mr-2 size-4 shrink-0 text-signal-800" />
          Clear, useful guidance
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
    <div className="relative mt-8 rounded-2xl border border-line p-4">
      <div className="relative flex items-center justify-between">
        <svg
          aria-hidden="true"
          className="absolute left-8 right-8 top-6 h-10 w-[calc(100%-4rem)] text-signal-300"
          fill="none"
          viewBox="0 0 300 40"
        >
          <path className="motion-safe:animate-signal-flow" d="M4 20H296" stroke="currentColor" strokeDasharray="5 6" strokeWidth="1.5" />
          <circle cx="4" cy="20" fill="currentColor" r="3" />
          <circle cx="296" cy="20" fill="currentColor" r="3" />
        </svg>
        <ProofNode icon={Mail} label="Inbox" />
        <ProofNode icon={Filter} label="Triage" />
      </div>
      <div className="relative mt-6">
        <svg
          aria-hidden="true"
          className="absolute left-[16%] top-0 h-10 w-[68%] text-signal-300"
          fill="none"
          viewBox="0 0 260 44"
        >
          <path d="M130 0V14M130 14H36M130 14H224M36 14V42M130 14V42M224 14V42" stroke="currentColor" strokeDasharray="4 5" strokeWidth="1.25" />
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

function ProofLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      aria-label={`Open ${label}`}
      className="absolute right-6 top-6 inline-flex size-10 items-center justify-center rounded-full border border-signal-100 bg-white text-signal-800 transition hover:border-signal-300 hover:bg-signal-50"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <ArrowUpRight aria-hidden="true" className="size-4" />
    </a>
  );
}

export function AuditProofSection() {
  return (
    <section aria-labelledby="proof-heading" className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-700 sm:text-xs">
            Proof
          </p>
          <h2
            className="mt-5 font-display text-4xl leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl md:text-6xl"
            id="proof-heading"
          >
            Customer-Facing. Operationally Sound.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-7 text-slate-700 sm:text-xl">
            Real work across customer-facing journeys and operational workflows.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-line bg-white shadow-soft lg:grid lg:grid-cols-3 lg:divide-x lg:divide-line">
          <article className="relative p-6 sm:p-8">
            <ProofLink href="https://pay4me.app" label="Pay4Me" />
            <ProofBadge>Customer-facing product</ProofBadge>
            <h3 className="mt-6 font-display text-3xl tracking-[-0.035em] text-signal-900">
              Pay4Me / WithRadius
            </h3>
            <p className="mt-3 max-w-xs text-base leading-6 text-slate-700">
              Payment experiences supporting complex international journeys.
            </p>
            <Pay4MeVisual />
          </article>

          <article className="relative border-t border-line p-6 sm:p-8 lg:border-t-0">
            <ProofLink href="https://github.com/Freeman-md/freemancodz-v4" label="Portfolio Assistant" />
            <ProofBadge>Customer guidance</ProofBadge>
            <h3 className="mt-6 font-display text-3xl tracking-[-0.035em] text-signal-900">
              Portfolio Assistant
            </h3>
            <p className="mt-3 max-w-xs text-base leading-6 text-slate-700">
              Guided answers that help visitors find clarity and take the next step.
            </p>
            <PortfolioAssistantVisual />
          </article>

          <article className="relative border-t border-line p-6 sm:p-8 lg:border-t-0">
            <ProofLink href="https://github.com/Freeman-md/email-pa" label="Email PA" />
            <ProofBadge>Operational workflow</ProofBadge>
            <h3 className="mt-6 font-display text-3xl tracking-[-0.035em] text-signal-900">Email PA</h3>
            <p className="mt-3 max-w-xs text-base leading-6 text-slate-700">
              Workflow system that reduces repetitive inbox handling.
            </p>
            <EmailWorkflowVisual />
          </article>
        </div>
      </Container>
    </section>
  );
}
