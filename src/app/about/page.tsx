import type { Metadata } from "next";

import { AboutHero } from "@/features/about/components/AboutHero";
import { AboutJourneySection } from "@/features/about/components/AboutJourneySection";
import { AboutClosingSection } from "@/features/about/components/AboutClosingSection";
import { AboutExplorationSection } from "@/features/about/components/AboutExplorationSection";
import { AboutOutsideEngineeringSection } from "@/features/about/components/AboutOutsideEngineeringSection";
import { AboutProductThinkingSection } from "@/features/about/components/AboutProductThinkingSection";
import { AboutWorkProcessSection } from "@/features/about/components/AboutWorkProcessSection";
import { createAboutPresentationData } from "@/features/portfolio/models/presentation-adapters";
import { siteConfig } from "@/shared/config/site-metadata";
import { getCachedAboutPageData } from "../_portfolio/portfolio-page-cache";

export const metadata: Metadata = {
  title: "About",
  description:
    "How Freeman Madudili designs customer-facing software and the reliable systems behind it.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: `About | ${siteConfig.shortName}`,
    description:
      "How Freeman Madudili designs customer-facing software and the reliable systems behind it.",
    url: "/about",
  },
  twitter: {
    title: `About | ${siteConfig.shortName}`,
    description:
      "How Freeman Madudili designs customer-facing software and the reliable systems behind it.",
  },
};

export default async function AboutPage() {
  const presentation = createAboutPresentationData(await getCachedAboutPageData());

  return (
    <>
      <AboutHero hero={presentation.hero} profile={presentation.profile} />
      <AboutJourneySection experiences={presentation.experiences} journey={presentation.journey} />
      <AboutProductThinkingSection profile={presentation.profile} thinking={presentation.thinking} />
      <AboutWorkProcessSection process={presentation.process} profile={presentation.profile} />
      <AboutExplorationSection exploration={presentation.exploration} profile={presentation.profile} />
      <AboutOutsideEngineeringSection outsideEngineering={presentation.outsideEngineering} />
      <AboutClosingSection closing={presentation.closing} profile={presentation.profile} />
    </>
  );
}
