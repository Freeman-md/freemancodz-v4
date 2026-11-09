import type { Metadata } from "next";
import { publicPortfolioService } from "@/modules/composition";
import { ProjectCard } from "../_portfolio/components/ProjectCard";
import { ProjectFilters } from "./_components/ProjectFilters";
import "./catalogue.css";

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected projects and explorations by Freeman Madudili.",
  alternates: { canonical: "/work" },
};

export default async function WorkPage() {
  const projects = await publicPortfolioService.listProjects();

  return (
    <section className="home-section work-catalogue" aria-labelledby="catalogue-heading">
      <header className="catalogue-heading">
        <span aria-hidden="true">PORTFOLIO</span>
        <h1 id="catalogue-heading">/ SELECTED WORK</h1>
      </header>
      <ProjectFilters
        projects={projects.map((project) => ({
          slug: project.slug,
          kind: project.kind,
          card: <ProjectCard project={project} />,
        }))}
      />
    </section>
  );
}
