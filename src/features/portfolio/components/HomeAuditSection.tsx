import { Container } from "@/shared/components/layout/Container";
import type { HomePresentationData } from "../models/portfolio-presentation";

export function HomeAuditSection({ audit }: Pick<HomePresentationData, "audit">) {
  return (
    <section
      aria-labelledby="home-audit-heading"
      className="bg-surface pt-4 pb-8 lg:pb-10"
      id="home-audit"
    >
      <Container>
        <div className="grid gap-8 border-t border-ink/10 pt-12 md:gap-12 lg:grid-cols-[3fr_2fr] lg:pt-16">
          <div>
            <p className="text-base font-medium text-muted">{audit.eyebrow}</p>
            <h2
              className="mt-4 max-w-[24ch] font-display text-4xl tracking-tight text-ink text-balance sm:text-5xl"
              id="home-audit-heading"
            >
              {audit.title}
            </h2>
          </div>
          <dl className="grid content-start gap-6">
            <div>
              <dt className="text-base font-medium text-ink">The friction</dt>
              <dd className="mt-2 text-base leading-7 text-muted">{audit.problem.copy}</dd>
            </div>
            <div>
              <dt className="text-base font-medium text-ink">A practical first step</dt>
              <dd className="mt-2 text-base leading-7 text-muted">{audit.improvement.copy}</dd>
            </div>
          </dl>
        </div>
      </Container>
    </section>
  );
}
