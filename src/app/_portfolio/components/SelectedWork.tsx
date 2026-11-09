import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProjectCard, type ProjectCardData } from "./ProjectCard";
import { SectionHeading } from "./SectionHeading";
import { SectionReveal } from "./SectionReveal";
import "./selected-work.css";

export function SelectedWork({ projects }: { projects: readonly ProjectCardData[] }) {
  return (
    <section className="home-section home-work" aria-labelledby="work">
      <SectionHeading
        id="work"
        description="Real products, from finding the right scent to making a creative request or payment."
      >
        Good software makes the next step clear.
      </SectionHeading>
      <SectionReveal className="home-project-grid">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} featured />
        ))}
      </SectionReveal>
      <div className="home-work-more">
        <Link href="/work">
          View rest of work
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <p>from explorations to real-world impact</p>
      </div>
    </section>
  );
}
