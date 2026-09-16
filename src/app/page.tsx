import { PortfolioStoryHero } from "@/features/portfolio/components/PortfolioStoryHero";
import { PortfolioWorkScene } from "@/features/portfolio/components/PortfolioWorkScene";
import { PortfolioSystemsScene } from "@/features/portfolio/components/PortfolioSystemsScene";
import { PortfolioMoreWork } from "@/features/portfolio/components/PortfolioMoreWork";
import { PortfolioFreemanScene } from "@/features/portfolio/components/PortfolioFreemanScene";
import { PortfolioAuditScene } from "@/features/portfolio/components/PortfolioAuditScene";
import { StoryMotion } from "@/features/portfolio/components/StoryMotion";
import "@/features/portfolio/components/portfolio-story.css";
import {
  createHomePresentationData,
  createWorkPresentationData,
  createAboutPresentationData,
  createAuditPresentationData,
} from "@/features/portfolio/portfolio-presentation.mapper";
import {
  getCachedHomePageData,
  getCachedWorkPageData,
  getCachedAboutPageData,
  getCachedAuditPageData,
} from "./_portfolio/portfolio-page-cache";

export default async function HomePage() {
  const [homeData, workData, aboutData, auditData] = await Promise.all([
    getCachedHomePageData(),
    getCachedWorkPageData(),
    getCachedAboutPageData(),
    getCachedAuditPageData(),
  ]);

  const home = createHomePresentationData(homeData);

  const work = createWorkPresentationData(workData);

  const about = createAboutPresentationData(aboutData);

  const audit = createAuditPresentationData(auditData);

  return (
    <div className="portfolio-story">
      <StoryMotion>
        <PortfolioStoryHero home={home} horizon={work.projects.acrossTheHorizon} />
        <PortfolioWorkScene work={work} />
        <PortfolioSystemsScene home={home} work={work} />
        <PortfolioMoreWork work={work} />
        <PortfolioFreemanScene about={about} home={home} />
        <PortfolioAuditScene audit={audit} home={home} />
      </StoryMotion>
    </div>
  );
}
