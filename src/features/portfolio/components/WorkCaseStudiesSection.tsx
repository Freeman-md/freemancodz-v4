import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Bot,
  Code2,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Wrench,
} from "lucide-react";

import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";

type CaseStudyLink = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

function CaseBadge({
  children,
  tone = "signal",
}: {
  children: React.ReactNode;
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

function StudyLink({ href, icon: Icon, label }: CaseStudyLink) {
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

function StudyPoint({
  children,
  compact = false,
  icon: Icon,
  title,
  tone = "signal",
}: {
  children: React.ReactNode;
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

function PortfolioAssistantPreview() {
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

function EmailWorkflowPreview() {
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

function FeaturedStudy() {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-soft lg:grid lg:min-h-[31rem] lg:grid-cols-[42%_58%]">
      <div className="order-2 flex flex-col p-6 sm:p-8 lg:order-1 lg:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <CaseBadge>
            <Star aria-hidden="true" className="size-3 fill-current" /> Featured
          </CaseBadge>
          <CaseBadge>Customer-facing product · Fintech</CaseBadge>
        </div>
        <h3 className="mt-6 font-display text-4xl tracking-[-0.04em] text-slate-950 sm:text-5xl">
          Pay4Me / WithRadius
        </h3>
        <div className="mt-8 grid gap-6">
          <StudyPoint icon={ShieldCheck} title="Problem">
            International users needed clear, dependable experiences for important onboarding and
            payment journeys.
          </StudyPoint>
          <StudyPoint icon={Wrench} title="Solution">
            Freeman built and supported production customer-facing functionality across interfaces,
            onboarding, payments and backend API integrations.
          </StudyPoint>
          <StudyPoint icon={TrendingUp} title="Outcome">
            More than <strong className="text-signal-700">US$500K</strong> processed through production
            payment workflows.
          </StudyPoint>
        </div>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-4 lg:mt-auto lg:pt-8">
          <a
            className="inline-flex items-center gap-2 rounded-md bg-signal-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(55,48,163,0.75)] transition hover:bg-signal-700"
            href="https://withradius.com"
            rel="noreferrer"
            target="_blank"
          >
            View Case Study
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
          <StudyLink href="https://withradius.com" label="View Live" />
        </div>
      </div>
      <div className="relative order-1 min-h-[22rem] overflow-hidden border-b border-line bg-slate-50 lg:order-2 lg:min-h-full lg:border-b-0 lg:border-l">
        <Image
          alt="WithRadius homepage showing its international payment experience"
          className="object-cover object-top"
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          src="/images/work/withradius-hero.jpg"
        />
      </div>
    </article>
  );
}

function CompactStudy({
  badge,
  children,
  links,
  title,
  tone = "signal",
  visual,
}: {
  badge: string;
  children: React.ReactNode;
  links: CaseStudyLink[];
  title: string;
  tone?: "signal" | "success";
  visual: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,34%)]">
        <div className="order-2 flex min-w-0 flex-col sm:order-1">
          <CaseBadge tone={tone}>{badge}</CaseBadge>
          <h3 className="mt-4 font-display text-2xl leading-tight tracking-[-0.035em] text-slate-950 sm:text-3xl">
            {title}
          </h3>
          <div className="mt-5 grid gap-5">{children}</div>
          <div className="mt-auto flex flex-wrap gap-x-5 gap-y-3 pt-6">
            {links.map((link) => (
              <StudyLink {...link} key={link.label} />
            ))}
          </div>
        </div>
        <div className="order-1 min-h-[15rem] overflow-hidden rounded-2xl border border-line bg-slate-50/50 p-3 sm:order-2 sm:p-4">
          {visual}
        </div>
      </div>
    </article>
  );
}

export function WorkCaseStudiesSection() {
  return (
    <section aria-labelledby="case-studies-heading" className="bg-[#fbf9f9] py-20 sm:py-28">
      <Container className="max-w-[1340px]">
        <MarketingSectionHeading
          copy={
            <p>
              Selected case studies across customer-facing products, operational systems and practical AI.
            </p>
          }
          eyebrow="Relevant work"
          id="case-studies-heading"
          title="Relevant Work. Real Problems. Meaningful Impact"
        />

        <div className="mt-12 space-y-6 sm:mt-16">
          <FeaturedStudy />

          <div className="grid items-start gap-6 xl:grid-cols-3">
            <CompactStudy
              badge="Customer guidance · AI product"
              links={[
                { href: "https://github.com/Freeman-md/freemancodz-v4", label: "View Case Study" },
                { href: "https://github.com/Freeman-md/freemancodz-v4", icon: Code2, label: "GitHub" },
              ]}
              title="Portfolio Assistant"
              visual={<PortfolioAssistantPreview />}
            >
              <StudyPoint compact icon={ShieldCheck} title="Problem">
                Different visitors need different information and next steps, but traditional navigation
                requires everyone to find those answers manually.
              </StudyPoint>
              <StudyPoint compact icon={Wrench} title="Solution">
                A customer-facing assistant that retrieves relevant information, answers with evidence and
                supports appropriate next actions.
              </StudyPoint>
            </CompactStudy>

            <CompactStudy
              badge="Operational workflow"
              links={[
                { href: "https://github.com/Freeman-md/email-pa", label: "View Case Study" },
                { href: "https://github.com/Freeman-md/email-pa", icon: Code2, label: "GitHub" },
              ]}
              title="Email PA"
              tone="success"
              visual={<EmailWorkflowPreview />}
            >
              <StudyPoint compact icon={ShieldCheck} title="Problem" tone="success">
                Important changes buried in email require repeated checking and manually reconstructing what
                has changed.
              </StudyPoint>
              <StudyPoint compact icon={Wrench} title="Solution" tone="success">
                A background workflow that detects relevant messages, understands changes and keeps important
                state visible.
              </StudyPoint>
            </CompactStudy>

            <CompactStudy
              badge="Customer-facing product · Study abroad"
              links={[
                { href: "https://acrossthehorizon.net", label: "View Case Study" },
                { href: "https://acrossthehorizon.net", label: "View Live" },
              ]}
              title="AcrossTheHorizon"
              visual={
                <div className="relative min-h-[13rem] overflow-hidden rounded-xl border border-line bg-white">
                  <Image
                    alt="AcrossTheHorizon study-abroad platform"
                    className="object-cover object-top"
                    fill
                    sizes="(min-width: 1024px) 30vw, 100vw"
                    src="/images/work/across-the-horizon.jpg"
                  />
                </div>
              }
            >
              <StudyPoint compact icon={ShieldCheck} title="Problem">
                A study-abroad platform helping users access education and relocation resources, offers,
                reviews and related services.
              </StudyPoint>
              <StudyPoint compact icon={Wrench} title="Solution">
                Freeman worked on production frontend experiences inside a Laravel application using Blade,
                Vue.js and Tailwind CSS.
              </StudyPoint>
            </CompactStudy>
          </div>
        </div>
      </Container>
    </section>
  );
}
