import { HomeAuditSection } from "@/features/portfolio/components/HomeAuditSection";
import { HomeClosingSection } from "@/features/portfolio/components/HomeClosingSection";
import { HomeHero } from "@/features/portfolio/components/HomeHero";
import { HomeImproveSection } from "@/features/portfolio/components/HomeImproveSection";
import { HomeRelevantWorkSection } from "@/features/portfolio/components/HomeRelevantWorkSection";
import { createHomePresentationData } from "@/features/portfolio/models/presentation-adapters";
import { getCachedHomePageData } from "./_portfolio/portfolio-page-cache";

export default async function HomePage() {
  const presentation = createHomePresentationData(await getCachedHomePageData());

  return (
    <>
      <HomeHero hero={presentation.hero} profile={presentation.profile} />
      <HomeImproveSection improve={presentation.improve} />
      <HomeRelevantWorkSection
        projects={presentation.projects}
        relevantWork={presentation.relevantWork}
      />
      <HomeAuditSection audit={presentation.audit} />
      <HomeClosingSection closing={presentation.closing} />
    </>
  );
}
