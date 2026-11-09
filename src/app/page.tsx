import type { Metadata } from "next";
import { publicPortfolioService } from "@/modules/composition";
import { SiteLayout } from "./_components/layout/SiteLayout";
import { siteConfig } from "./_config/site-metadata";
import { Contact, profiles } from "./_portfolio/components/Contact";
import { Experience } from "./_portfolio/components/Experience";
import { Hero } from "./_portfolio/components/Hero";
import { OutsideEngineering } from "./_portfolio/components/OutsideEngineering";
import { SelectedWork } from "./_portfolio/components/SelectedWork";
import { Services } from "./_portfolio/components/Services";
import { Testimonials } from "./_portfolio/components/Testimonials";
import "./_portfolio/homepage.css";

export const dynamic = "error";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const { profile, featured, experience, services } = await publicPortfolioService.getHomepage();

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteConfig.url.origin}/#person`,
    name: profile.name,
    jobTitle: profile.headline,
    url: siteConfig.url.toString(),
    description: profile.intro,
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
      <Hero profile={profile} />
      <SelectedWork projects={featured} />
      <Experience stops={experience} philosophy={profile.philosophy} />
      <Services services={services} />
      <Testimonials />
      <OutsideEngineering />
      <Contact />
    </SiteLayout>
  );
}
