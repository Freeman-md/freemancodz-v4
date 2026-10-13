import { PortfolioStory } from "./_portfolio/components/PortfolioStory/PortfolioStory";
import { siteConfig } from "./_config/site-metadata";
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

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteConfig.url.origin}/#person`,
    name: homeData.profile.name,
    jobTitle: homeData.profile.title,
    url: siteConfig.url.toString(),
    description: siteConfig.description,
    sameAs: [homeData.profile.linkedInUrl, homeData.profile.githubUrl].filter(Boolean),
    ...(homeData.profile.coverImage ? { image: homeData.profile.coverImage } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(person).replace(/</g, "\\u003c"),
        }}
      />
      <PortfolioStory home={home} work={work} about={about} audit={audit} />
    </>
  );
}
