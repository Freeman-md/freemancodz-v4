import { LinkButton } from "@/shared/components/ui/LinkButton";
import type { HomeAuditOffer } from "@/features/portfolio/models/home-page";
import { Container } from "@/shared/components/layout/Container";

export function AuditOfferSection({ offer }: { offer: HomeAuditOffer }) {
  return (
    <Container className="py-16 md:py-[120px]">
      <section className="relative overflow-hidden rounded-sm border border-black bg-black p-8 text-white md:p-12">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-6 inline-flex rounded-full bg-white px-3 py-1 font-mono text-[12px] text-black">
              {offer.label}
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] md:text-5xl">{offer.title}</h2>
            <p className="mt-5 text-lg leading-8 text-neutral-300">{offer.copy}</p>
            <LinkButton href={offer.actionHref} className="mt-8" variant="accent">
              {offer.actionLabel}
            </LinkButton>
          </div>
          <ul className="grid content-center gap-4 border-t border-white/20 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            {offer.checklist.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-neutral-200">
                <span aria-hidden="true" className="text-white/70">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Container>
  );
}
