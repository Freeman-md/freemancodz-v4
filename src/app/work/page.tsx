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
          <h1 className="text-[38px] font-semibold leading-[1.05] tracking-[-0.04em] text-ink md:text-[64px] md:leading-[1.1]">
            Selected Engineering Work
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted">
            Selected projects that show how I think, build, and solve problems
            across product engineering, frontend systems, backend workflows,
            AI-assisted systems, automation, and reliability.
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
