import { Button } from "@/components/Button";
import { CTASection } from "@/components/CTASection";
import { ExperienceCard } from "@/components/ExperienceCard";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { PrincipleCard } from "@/components/PrincipleCard";
import { ProjectCard } from "@/components/ProjectCard";
import { QuoteBlock } from "@/components/QuoteBlock";
import { SectionHeader } from "@/components/SectionHeader";
import { externalLinks } from "@/data/navigation";
import { experiences } from "@/data/experience";
import { profile } from "@/data/profile";
import { featuredProjects } from "@/data/projects";

export default function Home() {
  return (
    <>
      <section className="container grid min-h-[78vh] items-center gap-12 py-20 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.25em] text-accent">
            {profile.name}
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-black md:text-7xl">
            {profile.headline}
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-muted">
            {profile.intro}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href="/work">My Work</Button>
            <Button
              href={externalLinks.linkedin}
              variant="ghost"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn ↗
            </Button>
          </div>
        </div>
        <ImagePlaceholder
          src={externalLinks.heroImage}
          label="Freeman Madudili · Software Engineer"
          className="h-[420px] md:h-[560px]"
        />
      </section>
      <section className="border-y border-line bg-surface">
        <div className="container section">
          <SectionHeader
            title="What I Do"
            copy="Focused engineering support for founders and teams moving from idea to dependable product."
          />
          <div className="grid gap-4 md:grid-cols-4">
            {profile.services.map(([title, copy]) => (
              <div
                key={title}
                className="rounded border border-line bg-white p-7"
              >
                <h3 className="font-semibold text-black">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container section">
        <SectionHeader
          eyebrow="How I Think"
          title="A systems question before every build"
        />
        <QuoteBlock>{profile.philosophyQuestion}</QuoteBlock>
        <div className="mt-12 grid gap-8 md:grid-cols-5">
          {profile.principles.map((p, i) => (
            <PrincipleCard key={p} index={i + 1} text={p} />
          ))}
        </div>
      </section>
      <section className="border-y border-line bg-surface">
        <div className="container section">
          <SectionHeader
            title="Selected Work"
            copy="A concise view of product, automation, AI, and commercial systems work."
          />
          <div className="grid gap-5 md:grid-cols-2">
            {featuredProjects.map((p) => (
              <ProjectCard key={p.title} project={p} />
            ))}
          </div>
          <Button href="/work" variant="ghost" className="mt-8">
            Explore the Work Page
          </Button>
        </div>
      </section>
      <section className="container section">
        <SectionHeader
          title="Experience Snapshot"
          copy="Two focused professional contexts: operational pressure and commercial product engineering."
        />
        <div className="grid gap-5 md:grid-cols-2">
          {experiences.map((e) => (
            <ExperienceCard key={e.title} experience={e} />
          ))}
        </div>
      </section>
      <section className="border-y border-line bg-surface">
        <div className="container section grid gap-8 md:grid-cols-2">
          <div>
            <SectionHeader title="Education / Research Direction" />
            <div className="space-y-4 text-lg leading-8 text-muted">
              <p>{profile.education.current}</p>
              <p>{profile.education.previous}</p>
            </div>
          </div>
          <div className="rounded border border-line bg-white p-8">
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-black">
              Self-healing backend operations agent
            </h3>
            <p className="mt-5 leading-7 text-muted">
              {profile.education.research}
            </p>
            <p className="mt-4 leading-7 text-muted">
              {profile.education.support}
            </p>
          </div>
        </div>
      </section>
      <section className="container section">
        <SectionHeader
          eyebrow="Current Direction"
          title="AI-assisted software engineering"
          copy={profile.currentDirection}
        />
        <CTASection copy="Want to understand how I think and what I’ve built?" />
      </section>
    </>
  );
}
