import Link from "next/link";

import { Container } from "@/shared/components/layout/Container";
import type { HomePresentationData } from "../models/portfolio-presentation";

export function HomeImproveSection({ improve }: Pick<HomePresentationData, "improve">) {
  return (
    <section
      aria-labelledby="home-improve-heading"
      className="bg-surface pb-12 lg:pb-20"
      id="home-improve"
    >
      <Container>
        <h2 className="sr-only" id="home-improve-heading">
          {improve.title}
        </h2>
        <div className="grid gap-8 border-t border-ink/10 pt-8 md:grid-cols-[2fr_2fr_1fr] md:gap-12">
          {[improve.customerJourney, improve.operationalWorkflow].map((journey) => (
            <div key={journey.title}>
              <h3 className="text-base font-medium text-ink">{journey.title}</h3>
              <p className="mt-2 max-w-[56ch] text-base leading-7 text-muted">{journey.copy}</p>
            </div>
          ))}
          <div className="flex items-start md:justify-end">
            <Link
              className="inline-flex min-h-12 items-center font-medium text-ink underline decoration-ink/30 underline-offset-8 hover:decoration-signal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-700 active:text-signal-900"
              href="/about"
            >
              More about me
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
