import type { Metadata } from "next";
import { LegacyPortfolioRoute } from "@/features/portfolio/components/LegacyPortfolioRoute";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function LegacyPage() {
  return <LegacyPortfolioRoute page="work" />;
}
