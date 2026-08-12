import type { Metadata } from "next";

import { WorkAdditionalSection } from "@/features/portfolio/components/WorkAdditionalSection";
import { WorkCaseStudiesSection } from "@/features/portfolio/components/WorkCaseStudiesSection";
import { WorkConnectionSection } from "@/features/portfolio/components/WorkConnectionSection";
import { WorkCtaSection } from "@/features/portfolio/components/WorkCtaSection";
import { WorkHero } from "@/features/portfolio/components/WorkHero";
import { createWorkPresentationData } from "@/features/portfolio/models/presentation-adapters";
import { siteConfig } from "@/shared/config/site-metadata";
import { getCachedWorkPageData } from "../_portfolio/portfolio-page-cache";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Products and workflows built by Freeman Madudili around real customer, operational, and AI problems.",
  alternates: {
    canonical: "/work",
  },
  openGraph: {
    title: `Work | ${siteConfig.shortName}`,
    description:
      "Relevant work across customer-facing products, operational systems, and practical AI.",
    url: "/work",
  },
  twitter: {
    title: `Work | ${siteConfig.shortName}`,
    description:
      "Relevant work across customer-facing products, operational systems, and practical AI.",
  },
};

export default async function WorkPage() {
  const presentation = createWorkPresentationData(await getCachedWorkPageData());

  return (
    <>
      <WorkHero hero={presentation.hero} project={presentation.projects.pay4Me} />
      <WorkCaseStudiesSection projects={presentation.projects} relevantWork={presentation.relevantWork} />
      <WorkAdditionalSection additionalWork={presentation.additionalWork} projects={presentation.projects} />
      <WorkConnectionSection connects={presentation.connects} projects={presentation.projects} />
      <WorkCtaSection closing={presentation.closing} />
    </>
  );
}
