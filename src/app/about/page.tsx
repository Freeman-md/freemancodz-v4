import type { Metadata } from "next";

import { AboutHero } from "@/features/about/components/AboutHero";
import { AboutJourneySection } from "@/features/about/components/AboutJourneySection";
import { siteConfig } from "@/shared/config/site-metadata";

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

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutJourneySection />
    </>
  );
}
