import { HomeAuditSection } from "@/features/portfolio/components/HomeAuditSection";
import { HomeHero } from "@/features/portfolio/components/HomeHero";
import { HomeImproveSection } from "@/features/portfolio/components/HomeImproveSection";
import { HomeRelevantWorkSection } from "@/features/portfolio/components/HomeRelevantWorkSection";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeImproveSection />
      <HomeRelevantWorkSection />
      <HomeAuditSection />
    </>
  );
}
