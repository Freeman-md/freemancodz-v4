import "server-only";
import { type Prisma, type PrismaClient } from "@/generated/prisma/client";
import { ProjectKind } from "@/generated/prisma/enums";
import {
  caseStudySchema,
  experienceSchema,
  serviceSchema,
  profileSchema,
  publicProjectSchema,
  type PortfolioCaseStudy,
  type PortfolioExperience,
  type PortfolioProfile,
  type PortfolioProject,
  type PortfolioService,
} from "../data/portfolio.schema";

export interface PublicPortfolioRepository {
  getProfile(): Promise<PortfolioProfile | null>;
  listProjects(): Promise<readonly PortfolioProject[]>;
  findProject(slug: string): Promise<ProjectRecord | null>;
  listExperienceStops(): Promise<readonly PortfolioExperience[]>;
  listServices(): Promise<readonly PortfolioService[]>;
}

type ProjectRecord = PortfolioProject & {
  study: PortfolioCaseStudy | null;
  serviceLinks: readonly { position: number; service: PortfolioService }[];
};

function mapProject(row: Prisma.ProjectGetPayload<object>) {
  return publicProjectSchema.parse({
    ...row,
    kind: row.kind === ProjectKind.EXPLORATION ? "exploration" : "real-project",
    company: row.company ?? undefined,
    featured: row.featured ?? undefined,
  });
}

export class PrismaPublicPortfolioRepository implements PublicPortfolioRepository {
  constructor(private readonly db: PrismaClient) {}

  async getProfile() {
    const row = await this.db.profile.findUnique({ where: { key: "global" } });

    return row && profileSchema.parse(row);
  }

  async listProjects() {
    const rows = await this.db.project.findMany();

    return rows.map(mapProject);
  }

  async findProject(slug: string) {
    const row = await this.db.project.findUnique({
      where: { slug },
      include: { caseStudy: true, serviceLinks: { include: { service: true } } },
    });

    if (!row) {
      return null;
    }

    const { caseStudy, serviceLinks, ...project } = row;

    return {
      ...mapProject(project),
      study:
        caseStudy &&
        caseStudySchema.parse({
          ...caseStudy,
          serviceOffer: caseStudy.serviceOffer ?? undefined,
        }),
      serviceLinks: serviceLinks.map(({ position, service }) => ({
        position,
        service: serviceSchema.parse(service),
      })),
    };
  }

  async listExperienceStops() {
    return (await this.db.experience.findMany()).map((row) => experienceSchema.parse(row));
  }

  async listServices() {
    return (await this.db.service.findMany()).map((row) => serviceSchema.parse(row));
  }
}
