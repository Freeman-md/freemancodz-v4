import { Container } from "@/shared/components/layout/Container";
import { MarketingSectionHeading } from "@/shared/components/marketing/MarketingSectionHeading";
import { PortfolioIcon } from "@/features/portfolio/components/PortfolioIcon";
import type { PortfolioIcon as PortfolioIconModel } from "@/features/portfolio/models/portfolio-presentation";
import type { AuditPresentationData } from "@/features/portfolio/models/portfolio-presentation";

function Symptom({ iconName, label }: { iconName: PortfolioIconModel["iconName"]; label: string }) {
  return (
    <li className="flex min-h-20 items-center gap-4 border-t border-line py-5 sm:gap-5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50/60 text-red-500">
        <PortfolioIcon aria-hidden="true" className="size-4 stroke-[1.8]" name={iconName} />
      </div>
      <p className="text-base font-medium leading-6 text-slate-900 sm:text-lg">{label}</p>
    </li>
  );
}

export function AuditSymptomsSection({ symptoms }: Pick<AuditPresentationData, "symptoms">) {
  return (
    <section aria-labelledby="audit-why-heading" className="py-16 sm:py-20" id="audit-why">
      <Container>
        <MarketingSectionHeading
          copy={<p>{symptoms.copy}</p>}
          eyebrow={symptoms.eyebrow}
          id="audit-why-heading"
          title={symptoms.title}
        />

        <ul
          className="mt-10 grid border-b border-line lg:mt-12 lg:grid-cols-2 lg:gap-x-12"
          role="list"
        >
          {symptoms.icons.map((symptom) => (
            <Symptom {...symptom} key={symptom.label} />
          ))}
        </ul>
      </Container>
    </section>
  );
}
