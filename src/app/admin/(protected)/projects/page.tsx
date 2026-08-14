import { adminAuthService, portfolioAdministrationService } from "@/server/composition-root";
import { ProjectEditor } from "../../_components/AdminEditors";

export default async function AdminProjectsPage() {
  await adminAuthService.requireAdmin();
  const projects = await portfolioAdministrationService.getProjects();

  return (
    <section className="space-y-7">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-2 text-muted">
          Curated case studies and their approved visual identifiers. Canonical public compositions
          are protected from deletion.
        </p>
      </div>
      <ProjectEditor />
      {projects.map((project) => (
        <ProjectEditor
          key={project.id}
          item={{
            id: project.id,
            slug: project.slug,
            title: project.title,
            category: project.category,
            problem: project.problem,
            solution: project.solution,
            outcome: project.outcome,
            externalLinks: project.externalLinks,
            featured: project.featured,
            order: project.order,
            markdown: project.markdown,
            visualBlock:
              project.visualBlock === "Pay4MeVisual" ||
              project.visualBlock === "PortfolioAssistantVisual" ||
              project.visualBlock === "EmailWorkflowVisual"
                ? project.visualBlock
                : null,
            visualText: project.visualText,
          }}
          cover={project.cover ? { source: project.cover.source, type: project.cover.type } : null}
        />
      ))}
    </section>
  );
}
