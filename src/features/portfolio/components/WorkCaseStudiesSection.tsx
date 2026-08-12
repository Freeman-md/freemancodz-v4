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
import type { WorkPresentationData } from "../models/portfolio-presentation";

export function WorkCaseStudiesSection({ projects, relevantWork }: Pick<WorkPresentationData, "projects" | "relevantWork">) {
  const supporting = [projects.portfolioAssistant, projects.emailPa, projects.acrossTheHorizon];

  return (
    <section aria-labelledby="case-studies-heading" className="bg-[#fbf9f9] py-20 sm:py-28">
      <Container className="max-w-[1340px]">
        <MarketingSectionHeading
          copy={
            <p>
              {relevantWork.copy}
            </p>
          }
          eyebrow={relevantWork.eyebrow}
          id="case-studies-heading"
          title={relevantWork.title}
        />

        <div className="mt-12 space-y-6 sm:mt-16">
          <Pay4MeFeaturedProject project={projects.pay4Me} />

          <div className="grid items-start gap-6 xl:grid-cols-3">
            <SupportingProject
              actions={[
                { href: supporting[0].externalLinks[0] ?? "#", label: "View Case Study" },
                { href: supporting[0].externalLinks[0] ?? "#", icon: Code2, label: "GitHub" },
              ].map((link) => <StudyLink {...link} key={link.label} />)}
              badge={<CaseBadge>{supporting[0].category}</CaseBadge>}
              title={supporting[0].title}
              visual={<PortfolioAssistantPreview />}
            >
              <StudyPoint compact icon={ShieldCheck} title="Problem">
                {supporting[0].problem}
              </StudyPoint>
              <StudyPoint compact icon={Wrench} title="Solution">
                {supporting[0].solution}
              </StudyPoint>
            </SupportingProject>

            <SupportingProject
              actions={[
                { href: supporting[1].externalLinks[0] ?? "#", label: "View Case Study" },
                { href: supporting[1].externalLinks[0] ?? "#", icon: Code2, label: "GitHub" },
              ].map((link) => <StudyLink {...link} key={link.label} />)}
              badge={<CaseBadge tone="success">{supporting[1].category}</CaseBadge>}
              title={supporting[1].title}
              visual={<EmailWorkflowPreview />}
            >
              <StudyPoint compact icon={ShieldCheck} title="Problem" tone="success">
                {supporting[1].problem}
              </StudyPoint>
              <StudyPoint compact icon={Wrench} title="Solution" tone="success">
                {supporting[1].solution}
              </StudyPoint>
            </SupportingProject>

            <SupportingProject
              actions={[
                { href: supporting[2].externalLinks[0] ?? "#", label: "View Case Study" },
                { href: supporting[2].externalLinks[0] ?? "#", label: "View Live" },
              ].map((link) => <StudyLink {...link} key={link.label} />)}
              badge={<CaseBadge>{supporting[2].category}</CaseBadge>}
              title={supporting[2].title}
              visual={
                <div className="relative min-h-[13rem] overflow-hidden rounded-xl border border-line bg-white">
                  <Image
                    alt={supporting[2].cover?.altText ?? supporting[2].title}
                    className="object-cover object-top"
                    fill
                    sizes="(min-width: 1024px) 30vw, 100vw"
                    src={supporting[2].cover?.source ?? "/images/work/across-the-horizon.jpg"}
                  />
                </div>
              }
            >
              <StudyPoint compact icon={ShieldCheck} title="Problem">
                {supporting[2].problem}
              </StudyPoint>
              <StudyPoint compact icon={Wrench} title="Solution">
                {supporting[2].solution}
              </StudyPoint>
            </SupportingProject>
          </div>
        </div>
      </Container>
    </section>
  );
}
