import { Code2, ShieldCheck, Wrench } from "lucide-react";

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
import type { HomePresentationData } from "../models/portfolio-presentation";
import { PortfolioAction } from "./PortfolioAction";

export function HomeRelevantWorkSection({ projects, relevantWork }: Pick<HomePresentationData, "projects" | "relevantWork">) {
  const assistantHref = projects.portfolioAssistant.externalLinks[0] ?? "#";

  const emailHref = projects.emailPa.externalLinks[0] ?? "#";

  return (
    <section className="bg-[#fbf9f9] px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-[1340px]">
        <MarketingSectionHeading
          copy={<p>{relevantWork.copy}</p>}
          eyebrow={relevantWork.eyebrow}
          id="home-relevant-work-heading"
          title={relevantWork.title}
        />

        <div className="mt-12 space-y-6 sm:mt-16">
          <Pay4MeFeaturedProject project={projects.pay4Me} />
          <div className="grid gap-6 lg:grid-cols-2">
            <SupportingProject
              actions={
                <>
                  <StudyLink href={assistantHref} label="View Case Study" />
                  <StudyLink href={assistantHref} icon={Code2} label="Live Assistant" />
                </>
              }
              badge={<CaseBadge>Supporting project</CaseBadge>}
              title={projects.portfolioAssistant.title}
              visual={<PortfolioAssistantPreview />}
            >
              <StudyPoint compact icon={ShieldCheck} title="Problem">
                {projects.portfolioAssistant.problem}
              </StudyPoint>
              <StudyPoint compact icon={Wrench} title="Solution">
                {projects.portfolioAssistant.solution}
              </StudyPoint>
            </SupportingProject>

            <SupportingProject
              actions={
                <>
                  <StudyLink href={emailHref} label="View Case Study" />
                  <StudyLink href={emailHref} icon={Code2} label="GitHub" />
                </>
              }
              badge={<CaseBadge tone="success">Supporting project</CaseBadge>}
              title={projects.emailPa.title}
              visual={<EmailWorkflowPreview />}
            >
              <StudyPoint compact icon={ShieldCheck} title="Problem" tone="success">
                {projects.emailPa.problem}
              </StudyPoint>
              <StudyPoint compact icon={Wrench} title="Solution" tone="success">
                {projects.emailPa.solution}
              </StudyPoint>
            </SupportingProject>
          </div>
        </div>

        {relevantWork.actions.map((action) => (
          <PortfolioAction action={action} className="mx-auto mt-10 flex w-fit gap-3 text-lg" key={action.label} />
        ))}
      </div>
    </section>
  );
}
