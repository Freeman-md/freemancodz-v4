import type { ProjectWithCover } from "../models/portfolio-records";
export interface IProjectRepository {
  findAll(): Promise<ProjectWithCover[]>;
  findBySlug(slug: string): Promise<ProjectWithCover | null>;
  findBySlugs(slugs: string[]): Promise<ProjectWithCover[]>;
  findFeatured(): Promise<ProjectWithCover[]>;
}
