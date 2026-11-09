import "server-only";
import type { ExperienceStop } from "@/contracts/public-portfolio.contract";
import type { PublicPortfolioRepository } from "../repositories/public-portfolio.repository";

const incomplete = "Portfolio content is incomplete. Apply the portfolio seed before building.";

const unreadable =
  "Portfolio data could not be read. Check database access and portfolio migrations.";

export class PortfolioConfigurationError extends Error {}

function displayOrder<T extends { displayOrder: number }>(
  rows: readonly T[],
  key: (row: T) => string,
) {
  return rows.toSorted((a, b) => a.displayOrder - b.displayOrder || key(a).localeCompare(key(b)));
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

    const featured = displayOrder(projects, ({ slug }) => slug).filter(
      (project) => project.featured,
    );

    if (!profile || !featured.length || !experience.length || !services.length) {
      throw new PortfolioConfigurationError(incomplete);
    }

    const stops: ExperienceStop[] = displayOrder(experience, ({ key }) => key).map(
      ({ key, name, period, role, label, details, questions }) => ({
        key,
        name,
        period,
        role,
        label,
        detail: details.length === 1 ? details[0] : details,
        questions,
      }),
    );

    return {
      profile,
      featured,
      experience: stops,
      services: displayOrder(services, ({ key }) => key),
    };
  }

  async listProjects() {
    const projects = await this.read(() => this.repository.listProjects());

    if (!projects.length) {
      throw new PortfolioConfigurationError(incomplete);
    }

    return displayOrder(projects, ({ slug }) => slug);
  }

  async findProject(slug: string) {
    const record = await this.read(() => this.repository.findProject(slug));

    if (!record) {
      return null;
    }

    const { serviceLinks, ...project } = record;

    if (!serviceLinks.length) {
      throw new PortfolioConfigurationError(incomplete);
    }

    const services = serviceLinks
      .toSorted((a, b) => a.position - b.position)
      .map(({ service }) => service);

    return { ...project, services };
  }

  private async read<T>(query: () => Promise<T>) {
    try {
      return await query();
    } catch {
      throw new PortfolioConfigurationError(unreadable);
    }
  }
}
