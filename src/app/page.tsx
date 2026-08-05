import { AssistantTriggerButton } from "@/features/assistant/components/AssistantTriggerButton";
import { AuditOfferSection } from "@/features/portfolio/components/AuditOfferSection";
import { ProofOfWorkSection } from "@/features/portfolio/components/ProofOfWorkSection";
import { Container } from "@/shared/components/layout/Container";
import { ImagePlaceholder } from "@/shared/components/ui/ImagePlaceholder";
import { LinkButton } from "@/shared/components/ui/LinkButton";
import { SectionHeader } from "@/shared/components/ui/SectionHeader";
import { ServiceIcon } from "@/shared/components/ui/ServiceIcons";
import { portfolioService } from "@/server/composition-root";
import { siteAssetLinks } from "@/shared/config/links";

export default async function Home() {
  const { hero, servicesIntro, services, proof, auditOffer, finalCta } =
    await portfolioService.getHomePageData();

  return (
    <>
      <Container className="grid grid-cols-1 items-center gap-8 py-16 md:py-[120px] lg:grid-cols-12">
        <section className="lg:col-span-7 lg:pr-12">
          <p className="mb-6 font-mono text-[12px] uppercase tracking-[0.38em] text-accent">
            {hero.name}
          </p>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[0.96] tracking-[-0.06em] text-ink md:text-7xl md:leading-[0.96]">
            {hero.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{hero.intro}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <LinkButton href={hero.primaryHref}>{hero.primaryLabel}</LinkButton>
            <LinkButton href={hero.secondaryHref} variant="ghost">
              {hero.secondaryLabel}
            </LinkButton>
          </div>
        </section>
        <section className="lg:col-span-5">
          <ImagePlaceholder
            src={siteAssetLinks.heroImage}
            label="Freeman Madudili"
            caption="London, UK"
            className="h-[400px] md:h-[600px]"
          />
        </section>
      </Container>

      <Container className="py-20 md:py-[120px]">
        <SectionHeader title={servicesIntro.title} copy={servicesIntro.copy} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.title}
              className="flex h-full flex-col rounded-sm border border-line bg-white p-8 transition hover:border-neutral-300 hover:shadow-soft"
            >
              <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-sm bg-accent/10 text-accent">
                <ServiceIcon title={service.title} />
              </div>
              <h3 className="text-2xl font-medium tracking-[-0.03em] text-ink md:text-[28px]">
                {service.title}
              </h3>
              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-ink">{service.lead}</p>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted">{service.description}</p>
              <div className="mt-8">
                {service.assistantPrompt ? (
                  <AssistantTriggerButton
                    variant="text"
                    className="px-0 py-0"
                    detail={{ message: service.assistantPrompt }}
                  >
                    {service.cta}
                    <span aria-hidden="true">↗</span>
                  </AssistantTriggerButton>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </Container>

      <ProofOfWorkSection proof={proof} />
      <AuditOfferSection offer={auditOffer} />

      <Container className="pb-20 md:pb-[120px]">
        <section className="rounded-lg bg-black px-8 py-10 text-white md:px-12 md:py-12">
          <div className="flex flex-col gap-8">
            <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
              {finalCta.title}
            </h2>
            <div className="flex flex-wrap gap-3">
              <LinkButton href={finalCta.primaryHref} variant="accent">
                {finalCta.primaryLabel}
              </LinkButton>
              <LinkButton
                href={finalCta.secondaryHref}
                variant="ghost"
                className="border-white text-white hover:bg-white/10"
              >
                {finalCta.secondaryLabel}
              </LinkButton>
            </div>
          </div>
        </section>
      </Container>
    </>
  );
}
