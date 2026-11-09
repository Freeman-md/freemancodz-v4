import type { ReactNode } from "react";
import { FloatingPortfolioChat } from "../../_assistant/components/FloatingPortfolioChat";
import { Navbar } from "./Navbar";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-site">
      <Navbar />
      <main id="main-content" className="homepage" tabIndex={-1}>
        {children}
      </main>
      <FloatingPortfolioChat />
    </div>
  );
}
