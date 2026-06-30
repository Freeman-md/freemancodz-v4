import { Button } from "@/components/Button";
import { CTASection } from "@/components/CTASection";
import { Container } from "@/components/Container";
import { ExperienceCard } from "@/components/ExperienceCard";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { PrincipleCard } from "@/components/PrincipleCard";
import { ProjectCard } from "@/components/ProjectCard";
import { QuoteBlock } from "@/components/QuoteBlock";
import { SectionHeader } from "@/components/SectionHeader";
import { experiences } from "@/data/experience";
import { externalLinks } from "@/data/navigation";
import { profile } from "@/data/profile";
import { featuredProjects } from "@/data/projects";

export default function Home() {
  return (
    <>
      <Container className="grid grid-cols-1 items-center gap-8 py-16 md:py-[120px] lg:grid-cols-12">
        <section className="lg:col-span-7 lg:pr-12">
          <h1 className="max-w-4xl text-[38px] font-semibold leading-[1.05] tracking-[-0.04em] text-ink md:text-[64px] md:leading-[1.1]">
            {profile.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            {profile.heroNote}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/work">View My Work</Button>
            <Button
              href={externalLinks.linkedin}
              variant="ghost"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </Button>
          </div>
        </section>
        <section className="lg:col-span-5">
          <ImagePlaceholder
            src={externalLinks.heroImage}
            label="Freeman Madudili"
            caption="London, UK"
            className="h-[400px] md:h-[600px]"
          />
        </section>
      </Container>

      <section className="border-y border-line bg-surface">
        <Container className="py-16 md:py-24">
          <div className="mb-12 flex flex-col gap-4 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
            <h2 className="text-2xl font-medium tracking-[-0.03em] text-ink md:text-[28px]">
              Experience Snapshot
            </h2>
            {externalLinks.cv ? (
              <a
                href={externalLinks.cv}
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

      <Container className="py-16 md:py-[120px]">
        <section className="relative overflow-hidden rounded-sm border border-black bg-black p-8 text-white md:p-12">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded-full bg-white px-3 py-1 font-mono text-[12px] text-black">
              Current Focus
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
              AI engineering, backend reliability, and self-healing operations
              agent research.
            </h2>
            <p className="mt-5 text-lg leading-8 text-neutral-300">
              {profile.currentDirectionSupport}
            </p>
          </div>
        </section>
      </Container>

      <section className="bg-white py-20 md:py-[120px]">
        <Container>
          <QuoteBlock>{profile.philosophyQuestion}</QuoteBlock>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {profile.principles.map((principle, index) => (
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

      <Container className="py-20 md:py-[120px]">
        <SectionHeader
          title="What I Do"
          copy="Focused engineering support for founders and teams moving from idea to dependable product."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {profile.services.map(([title, copy]) => (
            <article
              key={title}
              className="rounded-sm border border-line bg-white p-8 transition hover:border-neutral-300 hover:shadow-soft"
            >
              <h3 className="text-2xl font-medium tracking-[-0.03em] text-ink">
                {title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </Container>

      <section className="border-y border-line bg-surface">
        <Container className="py-20 md:py-[120px]">
          <SectionHeader
            title="Selected Work"
            copy="Curated proof across AI product systems, automation workflows, fintech, and production-minded engineering."
          />
          <div className="grid gap-6 md:grid-cols-2">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.title} project={project} compact />
            ))}
          </div>
        </Container>
      </section>

      <Container className="grid gap-10 py-20 md:grid-cols-[0.9fr_1.1fr] md:py-[120px]">
        <section>
          <SectionHeader
            title="Education / Research Direction"
            copy={`${profile.education.current} ${profile.education.previous}`}
          />
        </section>
        <section className="rounded-sm border border-line bg-white p-8 md:p-12">
          <p className="font-mono text-[12px] tracking-[0.02em] text-muted">
            Research Direction
          </p>
          <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-ink md:text-5xl">
            Self-healing backend operations agents.
          </h3>
          <p className="mt-6 text-base leading-7 text-muted md:text-lg md:leading-8">
            {profile.education.research}
          </p>
          <p className="mt-4 text-base leading-7 text-muted md:text-lg md:leading-8">
            {profile.education.support}
          </p>
        </section>
      </Container>

      <Container className="pb-20 md:pb-[120px]">
        <CTASection copy="Want to understand how I think and what I’ve built?" />
      </Container>
    </>
  );
}
