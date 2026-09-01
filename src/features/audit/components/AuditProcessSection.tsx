import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import type { AuditPresentationData } from "@/features/portfolio/models/portfolio-presentation";

import { AuditProcessTimeline } from "./AuditProcessTimeline";

export function AuditProcessSection({ process }: Pick<AuditPresentationData, "process">) {
  return (
    <section aria-labelledby="audit-process-heading" className="py-20 sm:py-28" id="audit-process">
      <Container>
        <div className="lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(30rem,1.2fr)] lg:gap-20 xl:gap-28">
          <div className="lg:self-start">
            <MarketingSectionHeading
              align="left"
              copy={<p>{process.copy}</p>}
              eyebrow={process.eyebrow}
              id="audit-process-heading"
              title={process.title}
            />
          </div>
          <div className="mt-12 lg:mt-0">
            <AuditProcessTimeline
              stages={process.stages.map(({ copy, title }) => ({ copy, title }))}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
