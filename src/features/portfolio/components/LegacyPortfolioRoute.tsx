"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { portfolioDestination } from "../portfolio-navigation";

export function LegacyPortfolioRoute({ page }: { page: "work" | "about" | "audit" }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(portfolioDestination(page, window.location.hash));
  }, [page, router]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <p>This page is now part of Freeman’s portfolio.</p>
      <a className="mt-5 inline-block underline" href={portfolioDestination(page, "")}>
        Continue to {page === "about" ? "Freeman’s story" : page}
      </a>
    </div>
  );
}
