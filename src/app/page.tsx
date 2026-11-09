import { SiteLayout } from "./_components/layout/SiteLayout";
import { SITE_OWNER_NAME, siteConfig } from "./_config/site-metadata";
import { Contact, profiles } from "./_portfolio/components/Contact";
import { Experience } from "./_portfolio/components/Experience";
import { Hero, heroDescription } from "./_portfolio/components/Hero";
import { OutsideEngineering } from "./_portfolio/components/OutsideEngineering";
import { SelectedWork } from "./_portfolio/components/SelectedWork";
import { Services } from "./_portfolio/components/Services";
import { Testimonials } from "./_portfolio/components/Testimonials";
import "./_portfolio/homepage.css";

export default function HomePage() {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteConfig.url.origin}/#person`,
    name: SITE_OWNER_NAME,
    jobTitle: "Software Engineer",
    url: siteConfig.url.toString(),
    description: heroDescription,
    sameAs: Object.values(profiles),
    image: new URL("/images/homepage/hero-slope-v3.png", siteConfig.url).href,
  };

  return (
    <SiteLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(person).replace(/</g, "\\u003c"),
        }}
      />
      <Hero />
      <SelectedWork />
      <Experience />
      <Services />
      <Testimonials />
      <OutsideEngineering />
      <Contact />
    </SiteLayout>
  );
}
