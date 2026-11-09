import "server-only";

import type { ExperienceStop } from "@/contracts/public-portfolio.contract";
import projects from "../data/projects.json";
import experienceStops from "../data/experience-stops.json";
import {
  experienceStopsSchema,
  projectCatalogueSchema,
  type ProjectCaseStudy,
} from "../data/project-case-study.schema";

export interface PublicPortfolioRepository {
  listProjects(): Promise<readonly ProjectCaseStudy[]>;
  findProject(slug: string): Promise<ProjectCaseStudy | null>;
  listExperienceStops(): Promise<readonly ExperienceStop[]>;
}

export class JsonPublicPortfolioRepository implements PublicPortfolioRepository {
  private readonly projects: readonly ProjectCaseStudy[];

  private readonly stops: readonly ExperienceStop[];

  constructor(projectRecords: unknown = projects, experienceRecords: unknown = experienceStops) {
    this.projects = projectCatalogueSchema.parse(projectRecords);
    this.stops = experienceStopsSchema.parse(experienceRecords);
  }

  async listProjects() {
    return this.projects;
  }

  async findProject(slug: string) {
    return this.projects.find((project) => project.slug === slug) ?? null;
  }

  async listExperienceStops() {
    return this.stops;
  }
}
