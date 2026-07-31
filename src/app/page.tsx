import { AssistantTriggerButton } from "@/features/assistant/components/AssistantTriggerButton";
import { LinkButton as Button } from "@/shared/components/ui/LinkButton";
import { CTASection } from "@/features/portfolio/components/CTASection";
import { Container } from "@/shared/components/layout/Container";
import { ExperienceCard } from "@/features/portfolio/components/ExperienceCard";
import { ImagePlaceholder } from "@/shared/components/ui/ImagePlaceholder";
import { PrincipleCard } from "@/features/portfolio/components/PrincipleCard";
import { ProjectCard } from "@/features/portfolio/components/ProjectCard";
import { QuoteBlock } from "@/shared/components/ui/QuoteBlock";
import { SectionHeader } from "@/shared/components/ui/SectionHeader";
import { ServiceIcon } from "@/shared/components/ui/ServiceIcons";
import { portfolioService } from "@/server/composition-root";
import { siteAssetLinks } from "@/shared/config/links";

export default async function Home() {
  const {
    hero,
    philosophy,
    currentDirection,
    services,
    principles,
    featuredProjects,
    experiences,
  } = await portfolioService.getHomePageData();
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
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            {hero.intro}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/work">View My Work</Button>
            <AssistantTriggerButton variant="ghost">
              Talk to My Assistant
            </AssistantTriggerButton>
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
        <SectionHeader
          title="What I Build"
          copy="Two connected systems: assistants that handle the interaction, and workflows that handle what happens next."
        />
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
              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-ink">
                {service.lead}
              </p>

              <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
                {service.description}
              </p>
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
                ) : (
                  <span className="inline-flex items-center gap-2 font-mono text-[12px] font-medium tracking-[0.02em] text-ink">
                    {service.cta}
                    <span aria-hidden="true">↗</span>
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </Container>

      <section className="border-y border-line bg-surface">
        <Container className="py-20 md:py-[120px]">
          <SectionHeader
            title="Featured Work"
            copy="Curated proof across AI product systems, automation workflows, fintech, and production-minded engineering."
          />
          <div className="grid gap-6 md:grid-cols-2">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.title} project={project} compact />
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-16 md:py-[120px]">
        <section className="relative overflow-hidden rounded-sm border border-black bg-black p-8 text-white md:p-12">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded-full bg-white px-3 py-1 font-mono text-[12px] text-black">
              Current Focus
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
              {currentDirection.currentDirection}
            </h2>
            <p className="mt-5 text-lg leading-8 text-neutral-300">
              {currentDirection.currentDirectionSupport}
            </p>
          </div>
        </section>
      </Container>

      <section className="border-y border-line bg-surface">
        <Container className="py-16 md:py-24">
          <div className="mb-12 flex flex-col gap-4 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
            <h2 className="text-2xl font-medium tracking-[-0.03em] text-ink md:text-[28px]">
              Experience
            </h2>
            {siteAssetLinks.cv ? (
              <a
                href={siteAssetLinks.cv}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[12px] text-accent transition hover:underline"
              >
                Full Resume
              </a>
            ) : null}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {experiences.map((experience) => (
              <ExperienceCard key={experience.title} experience={experience} />
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 md:py-[120px]">
        <Container>
          <p className="mb-6 font-mono text-[12px] uppercase tracking-[0.38em] text-accent">
            Engineering philosophy
          </p>
          <QuoteBlock>{philosophy.philosophyQuestion}</QuoteBlock>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {principles.map((principle, index) => (
              <PrincipleCard
                key={principle.title}
                index={index + 1}
                title={principle.title}
                text={principle.body}
              />
            ))}
          </div>
        </Container>
      </section>

      <Container className="pb-20 md:pb-[120px]">
        <CTASection copy="Want to understand how I think and what I’ve built?" />
      </Container>
    </>
  );
}
