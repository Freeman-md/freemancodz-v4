import Image from "next/image";
import { Code2, ShieldCheck, Wrench } from "lucide-react";

import { Pay4MeFeaturedProject } from "@/features/portfolio/components/Pay4MeFeaturedProject";
import {
  CaseBadge,
  EmailWorkflowPreview,
  PortfolioAssistantPreview,
  StudyLink,
  StudyPoint,
} from "@/features/portfolio/components/PortfolioProjectElements";
import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { SupportingProject } from "@/shared/components/marketing/SupportingProject";

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
          <Pay4MeFeaturedProject />

          <div className="grid items-start gap-6 xl:grid-cols-3">
            <SupportingProject
              actions={[
                { href: "https://github.com/Freeman-md/freemancodz-v4", label: "View Case Study" },
                { href: "https://github.com/Freeman-md/freemancodz-v4", icon: Code2, label: "GitHub" },
              ].map((link) => <StudyLink {...link} key={link.label} />)}
              badge={<CaseBadge>Customer guidance · AI product</CaseBadge>}
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
            </SupportingProject>

            <SupportingProject
              actions={[
                { href: "https://github.com/Freeman-md/email-pa", label: "View Case Study" },
                { href: "https://github.com/Freeman-md/email-pa", icon: Code2, label: "GitHub" },
              ].map((link) => <StudyLink {...link} key={link.label} />)}
              badge={<CaseBadge tone="success">Operational workflow</CaseBadge>}
              title="Email PA"
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
            </SupportingProject>

            <SupportingProject
              actions={[
                { href: "https://acrossthehorizon.net", label: "View Case Study" },
                { href: "https://acrossthehorizon.net", label: "View Live" },
              ].map((link) => <StudyLink {...link} key={link.label} />)}
              badge={<CaseBadge>Customer-facing product · Study abroad</CaseBadge>}
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
            </SupportingProject>
          </div>
        </div>
      </Container>
    </section>
  );
}
