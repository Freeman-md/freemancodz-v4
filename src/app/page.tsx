import { PortfolioStoryHero } from "./_portfolio/components/PortfolioStoryHero";
import { PortfolioWorkScene } from "./_portfolio/components/PortfolioWorkScene";
import { PortfolioSystemsScene } from "./_portfolio/components/PortfolioSystemsScene";
import { PortfolioMoreWork } from "./_portfolio/components/PortfolioMoreWork";
import { PortfolioFreemanScene } from "./_portfolio/components/PortfolioFreemanScene";
import { PortfolioAuditScene } from "./_portfolio/components/PortfolioAuditScene";
import { StoryMotion } from "./_portfolio/components/StoryMotion";
import "./_portfolio/portfolio-story.css";
import {
  createHomePresentationData,
  createWorkPresentationData,
  createAboutPresentationData,
  createAuditPresentationData,
} from "./_portfolio/presentation.mapper";
import {
  getCachedHomePageData,
  getCachedWorkPageData,
  getCachedAboutPageData,
  getCachedAuditPageData,
} from "./_portfolio/cached-public-data";

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
