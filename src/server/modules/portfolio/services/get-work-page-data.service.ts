import "server-only";
import { findProjects } from "@/server/modules/portfolio/repositories/project.repository";
import { mapProject } from "@/server/modules/portfolio/mappers/portfolio-view.mapper";
import type { WorkPageData } from "@/server/modules/portfolio/models/portfolio-view.model";

export async function getWorkPageData(): Promise<WorkPageData> {
  const projects = (await findProjects()).map(mapProject);
  if (projects.length === 0) {
    throw new Error("Required portfolio projects not found");
  }

  return {
    featuredProjects: projects.filter((project) => project.featured),
    otherProjects: projects.filter((project) => !project.featured),
  };
}
