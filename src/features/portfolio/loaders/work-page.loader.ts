import "server-only";
import { findProjects } from "@/features/portfolio/data/projects.query";
import { mapProject } from "@/features/portfolio/mappers/portfolio.mapper";
import type { WorkPageData } from "@/features/portfolio/types";

export async function getWorkPageData(): Promise<WorkPageData> {
  const projects = (await findProjects()).map(mapProject);
  return { featuredProjects: projects.filter((project) => project.featured), otherProjects: projects.filter((project) => !project.featured) };
}
