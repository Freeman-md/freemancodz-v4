import "server-only";
import type { PublicPortfolioRepository } from "../repositories/public-portfolio.repository";

export class PortfolioConfigurationError extends Error {
  constructor() {
    super("The portfolio data is unavailable or incomplete.");
  }
}

export class PublicPortfolioService {
  constructor(private readonly repository: PublicPortfolioRepository) {}

  async getHomepage() {
    const [profile, projects, experience, services] = await this.read(() =>
      Promise.all([
        this.repository.getProfile(),
        this.repository.listProjects(),
        this.repository.listExperienceStops(),
        this.repository.listServices(),
      ]),
    );

    const featured = projects.filter((project) => project.featured);

    if (!profile || !featured.length || !experience.length || !services.length) {
      throw new PortfolioConfigurationError();
    }

    return { profile, featured, experience, services };
  }

  async listProjects() {
    const projects = await this.read(() => this.repository.listProjects());

    if (!projects.length) {
      throw new PortfolioConfigurationError();
    }

    return projects;
  }

  async findProject(slug: string) {
    const project = await this.read(() => this.repository.findProject(slug));

    if (project && !project.services.length) {
      throw new PortfolioConfigurationError();
    }

    return project;
  }

  private async read<T>(query: () => Promise<T>) {
    try {
      return await query();
    } catch {
      throw new PortfolioConfigurationError();
    }
  }
}
