import type { ReactNode } from "react";
import { SiteLayout } from "../_components/layout/SiteLayout";
import "../_portfolio/homepage.css";
import "../_portfolio/components/selected-work.css";

export default function WorkLayout({ children }: { children: ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>;
}
