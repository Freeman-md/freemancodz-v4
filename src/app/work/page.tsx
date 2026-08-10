import type { Metadata } from "next";

import { WorkAdditionalSection } from "@/features/portfolio/components/WorkAdditionalSection";
import { WorkCaseStudiesSection } from "@/features/portfolio/components/WorkCaseStudiesSection";
import { WorkHero } from "@/features/portfolio/components/WorkHero";
import { siteConfig } from "@/shared/config/site-metadata";

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

export default function WorkPage() {
  return (
    <>
      <WorkHero />
      <WorkCaseStudiesSection />
      <WorkAdditionalSection />
    </>
  );
}
