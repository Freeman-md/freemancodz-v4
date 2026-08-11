import Link from "next/link";
import { ArrowRight, Code2, ShieldCheck, Wrench } from "lucide-react";

import { Pay4MeFeaturedProject } from "@/features/portfolio/components/Pay4MeFeaturedProject";
import {
  CaseBadge,
  EmailWorkflowPreview,
  PortfolioAssistantPreview,
  StudyLink,
  StudyPoint,
} from "@/features/portfolio/components/PortfolioProjectElements";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { SupportingProject } from "@/shared/components/marketing/SupportingProject";

export function HomeRelevantWorkSection() {
  return (
    <section className="bg-[#fbf9f9] px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-[1340px]">
        <MarketingSectionHeading
          copy={<p>A few examples of customer-facing products and operational systems built around real problems.</p>}
          eyebrow="Proof of work"
          id="home-relevant-work-heading"
          title="Relevant Work"
        />

        <div className="mt-12 space-y-6 sm:mt-16">
          <Pay4MeFeaturedProject />
          <div className="grid gap-6 lg:grid-cols-2">
            <SupportingProject
              actions={
                <>
                  <StudyLink href="https://github.com/Freeman-md/freemancodz-v4" label="View Case Study" />
                  <StudyLink href="https://github.com/Freeman-md/freemancodz-v4" icon={Code2} label="Live Assistant" />
                </>
              }
              badge={<CaseBadge>Supporting project</CaseBadge>}
              title="Portfolio Assistant"
              visual={<PortfolioAssistantPreview />}
            >
              <StudyPoint compact icon={ShieldCheck} title="Problem">
                Portfolios struggle to communicate relevant work and convert visitors.
              </StudyPoint>
              <StudyPoint compact icon={Wrench} title="Solution">
                An assistant that answers visitor questions and guides them through projects.
              </StudyPoint>
            </SupportingProject>

            <SupportingProject
              actions={
                <>
                  <StudyLink href="https://github.com/Freeman-md/email-pa" label="View Case Study" />
                  <StudyLink href="https://github.com/Freeman-md/email-pa" icon={Code2} label="GitHub" />
                </>
              }
              badge={<CaseBadge tone="success">Supporting project</CaseBadge>}
              title="Email PA"
              visual={<EmailWorkflowPreview />}
            >
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
