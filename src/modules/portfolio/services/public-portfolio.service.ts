import "server-only";

import type { PublicPortfolioRepository } from "../repositories/public-portfolio.repository";

export class PublicPortfolioService {
  constructor(private readonly repository: PublicPortfolioRepository) {}

  listProjects() {
    return this.repository.listProjects();
  }

  findProject(slug: string) {
    return this.repository.findProject(slug);
  }

  async listFeaturedProjects() {
    return (await this.repository.listProjects()).filter((project) => project.featured);
  }

  listExperienceStops() {
    return this.repository.listExperienceStops();
  }
}
