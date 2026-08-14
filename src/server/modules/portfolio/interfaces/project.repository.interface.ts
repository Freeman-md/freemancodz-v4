import type { ProjectWithCover } from "../models/portfolio-records";
import type { UpsertProjectInput } from "@/contracts/portfolio-admin.contract";
export interface IProjectRepository {
  findAll(): Promise<ProjectWithCover[]>;
  findBySlug(slug: string): Promise<ProjectWithCover | null>;
  findBySlugs(slugs: string[]): Promise<ProjectWithCover[]>;
  findFeatured(): Promise<ProjectWithCover[]>;
}
export interface IProjectAdministrationRepository extends IProjectRepository {
  findById(id: string): Promise<ProjectWithCover | null>;
  create(input: UpsertProjectInput): Promise<string>;
  update(id: string, input: UpsertProjectInput): Promise<void>;
  delete(id: string): Promise<void>;
}
