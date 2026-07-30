import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { siteAssetLinks } from "@/shared/config/links";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer cvUrl={siteAssetLinks.cv} />
    </>
  );
}
