import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Code2, ShieldCheck, TrendingUp, Wrench } from "lucide-react";

import {
  CaseBadge,
  EmailWorkflowPreview,
  PortfolioAssistantPreview,
  StudyLink,
  StudyPoint,
} from "@/features/portfolio/components/WorkCaseStudiesSection";

function FeaturedProject() {
  return (
    <article className="overflow-hidden rounded-3xl border border-signal-100 bg-white shadow-soft lg:grid lg:grid-cols-[40%_60%]">
      <div className="flex flex-col p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap gap-3">
          <CaseBadge>Featured project</CaseBadge>
          <CaseBadge>Customer-facing product</CaseBadge>
        </div>
        <h3 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
          Pay4Me / WithRadius
        </h3>

        <div className="order-1 my-7 min-h-[18rem] overflow-hidden rounded-2xl border border-line bg-slate-50 lg:hidden">
          <div className="relative h-[22rem]">
            <Image
              alt="WithRadius international payment experience"
              className="object-cover object-top"
              fill
              sizes="100vw"
              src="/images/work/withradius-hero.jpg"
            />
          </div>
        </div>

        <div className="grid gap-5 lg:mt-8">
          <StudyPoint icon={ShieldCheck} title="Problem">
            Complex payments and payout processes were confusing users and slowing business growth.
          </StudyPoint>
          <StudyPoint icon={Wrench} title="Solution">
            Built dependable customer journeys across onboarding, payments and backend API integrations.
          </StudyPoint>
          <StudyPoint icon={TrendingUp} title="Outcome">
            More than <strong className="text-signal-700">US$500K</strong> processed through production payment workflows.
          </StudyPoint>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4 lg:mt-auto lg:pt-8">
          <a
            className="inline-flex items-center gap-3 rounded-lg bg-signal-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_28px_-16px_rgba(55,48,163,0.75)] transition hover:bg-signal-700"
            href="https://withradius.com"
            rel="noreferrer"
            target="_blank"
          >
            View Case Study
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
          <StudyLink href="https://withradius.com" label="Visit Website" />
        </div>
      </div>

      <div className="relative hidden min-h-[34rem] overflow-hidden border-l border-line bg-slate-50 lg:block">
        <Image
          alt="WithRadius international payment experience"
          className="object-cover object-top"
          fill
          sizes="60vw"
          src="/images/work/withradius-hero.jpg"
        />
      </div>
    </article>
  );
}

function SupportingProject({
  children,
  title,
  tone = "signal",
  visual,
}: {
  children: React.ReactNode;
  title: string;
  tone?: "signal" | "success";
  visual: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6">
      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,36%)] sm:items-stretch">
        <div className="flex min-w-0 flex-col">
          <CaseBadge tone={tone}>Supporting project</CaseBadge>
          <h3 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h3>
          <div className="mt-5 grid gap-5">{children}</div>
          <div className="mt-auto flex flex-wrap gap-x-6 gap-y-3 pt-7">
            <StudyLink href={title === "Email PA" ? "https://github.com/Freeman-md/email-pa" : "https://github.com/Freeman-md/freemancodz-v4"} label="View Case Study" />
            <StudyLink
              href={title === "Email PA" ? "https://github.com/Freeman-md/email-pa" : "https://github.com/Freeman-md/freemancodz-v4"}
              icon={Code2}
              label={title === "Email PA" ? "GitHub" : "Live Assistant"}
            />
          </div>
        </div>
        <div className="min-h-[14rem] overflow-hidden rounded-2xl border border-line bg-slate-50/50 p-3 sm:p-4">
          {visual}
        </div>
      </div>
    </article>
  );
}

export function HomeRelevantWorkSection() {
  return (
    <section className="bg-[#fbf9f9] px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-[1340px]">
        <header className="mx-auto max-w-3xl text-center">
          <h2 className="text-[clamp(2.7rem,6vw,4.5rem)] font-semibold leading-none tracking-[-0.055em] text-slate-950">
            Relevant Work
          </h2>
          <span aria-hidden="true" className="mx-auto mt-6 block h-1 w-16 rounded-full bg-signal-600" />
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            A few examples of customer-facing products and operational systems built around real problems.
          </p>
        </header>

        <div className="mt-12 space-y-6 sm:mt-16">
          <FeaturedProject />
          <div className="grid gap-6 lg:grid-cols-2">
            <SupportingProject title="Portfolio Assistant" visual={<PortfolioAssistantPreview />}>
              <StudyPoint compact icon={ShieldCheck} title="Problem">
                Portfolios struggle to communicate relevant work and convert visitors.
              </StudyPoint>
              <StudyPoint compact icon={Wrench} title="Solution">
                An assistant that answers visitor questions and guides them through projects.
              </StudyPoint>
            </SupportingProject>

            <SupportingProject title="Email PA" tone="success" visual={<EmailWorkflowPreview />}>
              <StudyPoint compact icon={ShieldCheck} title="Problem" tone="success">
                Managing email and routine requests takes hours of repetitive manual work.
              </StudyPoint>
              <StudyPoint compact icon={Wrench} title="Solution" tone="success">
                A workflow that understands messages and keeps important state visible.
              </StudyPoint>
            </SupportingProject>
          </div>
        </div>

        <Link className="mx-auto mt-10 flex w-fit items-center gap-3 text-lg font-semibold text-signal-700 transition hover:text-signal-900" href="/work">
          View All Work
          <ArrowRight aria-hidden="true" className="size-5" />
        </Link>
      </div>
    </section>
  );
}
