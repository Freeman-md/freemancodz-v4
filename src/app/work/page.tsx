import { CTASection } from "@/components/CTASection";
import { Container } from "@/components/Container";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectFeature } from "@/components/ProjectFeature";
import { featuredProjects, otherProjects } from "@/data/projects";

export default function WorkPage() {
  return (
    <>
      <Container className="pb-20 pt-44 md:pb-[120px] md:pt-[120px]">
        <section className="max-w-3xl">
          <p className="mb-6 font-mono text-[12px] uppercase tracking-[0.38em] text-accent">
            Selected Engineering Work
          </p>
          <h1 className="text-[48px] font-semibold leading-[0.96] tracking-[-0.06em] text-ink md:text-[76px] md:leading-[0.96]">
            Projects that show how I think and build.
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted">
            A small set of commercial and personal projects across product engineering, AI automation, and reliable systems.
          </p>
        </section>

        <section className="mt-16 space-y-16 md:mt-[120px] md:space-y-32">
          {featuredProjects.map((project, index) => (
            <ProjectFeature
              key={project.title}
              project={project}
              reverse={index % 2 === 1}
            />
          ))}
        </section>

        <section className="mt-20 md:mt-[120px]">
          <div className="mb-8 border-b border-line pb-4">
            <h2 className="text-2xl font-medium tracking-[-0.03em] text-ink md:text-[28px]">
              Internal Tools & Ops
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-1">
            {otherProjects.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </section>
      </Container>

      <Container className="pb-20 md:pb-[120px]">
        <CTASection copy="Want to discuss a product, automation workflow, or reliability problem?" />
      </Container>
    </>
  );
}
