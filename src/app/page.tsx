import { PortfolioStory } from "./_portfolio/components/PortfolioStory/PortfolioStory";
import {
  createHomePresentationData,
  createWorkPresentationData,
  createAboutPresentationData,
  createAuditPresentationData,
} from "./_portfolio/data/presentation.mapper";
import {
  getCachedHomePageData,
  getCachedWorkPageData,
  getCachedAboutPageData,
  getCachedAuditPageData,
} from "./_portfolio/data/cached-public-data";

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

  return <PortfolioStory home={home} work={work} about={about} audit={audit} />;
}
