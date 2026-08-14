import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function SiteLayout({ children, linkedInUrl, githubUrl }: { children: ReactNode; linkedInUrl: string; githubUrl: string }) {
  return (
    <>
      <Navbar linkedInUrl={linkedInUrl} />
      <main>{children}</main>
      <Footer linkedInUrl={linkedInUrl} githubUrl={githubUrl} />
    </>
  );
}
