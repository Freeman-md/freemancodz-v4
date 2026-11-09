import "server-only";
import { type Prisma, type PrismaClient } from "@/generated/prisma/client";
import { ProjectKind } from "@/generated/prisma/enums";
import {
  experienceStopSchema,
  type ExperienceStop,
  type ProjectKind as PublicKind,
} from "@/contracts/public-portfolio.contract";
import {
  caseStudySchema,
  coverSchema,
  featuredSchema,
  linksSchema,
  type PortfolioCaseStudy,
  type PortfolioProfile,
  type PortfolioProject,
  type PortfolioService,
} from "../data/portfolio.schema";

export interface PublicPortfolioRepository {
  getProfile(): Promise<PortfolioProfile | null>;
  listProjects(): Promise<readonly PortfolioProject[]>;
  findProject(slug: string): Promise<ProjectDetail | null>;
  listExperienceStops(): Promise<readonly ExperienceStop[]>;
  listServices(): Promise<readonly PortfolioService[]>;
}

export type ProjectDetail = PortfolioProject & {
  study: PortfolioCaseStudy | null;
  services: readonly PortfolioService[];
};

export function toDatabaseKind(kind: PublicKind): ProjectKind {
  return kind === "exploration" ? ProjectKind.EXPLORATION : ProjectKind.REAL_PROJECT;
}

function mapProject(row: Prisma.ProjectGetPayload<object>): PortfolioProject {
  return {
    ...row,
    kind: row.kind === ProjectKind.EXPLORATION ? "exploration" : "real-project",
    company: row.company ?? undefined,
    cover: coverSchema.parse(row.cover),
    links: linksSchema.parse(row.links),
    featured: row.featured === null ? undefined : featuredSchema.parse(row.featured),
  };
}

export class PrismaPublicPortfolioRepository implements PublicPortfolioRepository {
  constructor(private readonly db: PrismaClient) {}

  async getProfile() {
    const row = await this.db.profile.findUnique({ where: { key: "global" } });

    return row && { ...row, key: "global" as const };
  }

  async listProjects() {
    const rows = await this.db.project.findMany({
      orderBy: [{ displayOrder: "asc" }, { slug: "asc" }],
    });

    return rows.map(mapProject);
  }

  async findProject(slug: string) {
    const row = await this.db.project.findUnique({
      where: { slug },
      include: {
        caseStudy: true,
        serviceLinks: { orderBy: { position: "asc" }, include: { service: true } },
      },
    });

    if (!row) {
      return null;
    }

    const { caseStudy, serviceLinks, ...project } = row;

    return {
      ...mapProject(project),
      study:
        caseStudy &&
        caseStudySchema.parse({ ...caseStudy, serviceOffer: caseStudy.serviceOffer ?? undefined }),
      services: serviceLinks.map(({ service }) => service),
    };
  }

  async listExperienceStops() {
    const rows = await this.db.experience.findMany({
      orderBy: [{ displayOrder: "asc" }, { key: "asc" }],
    });

    return rows.map(({ key, name, period, role, label, details, questions }) =>
      experienceStopSchema.parse({
        key,
        name,
        period,
        role,
        label,
        detail: details.length === 1 ? details[0] : details,
        questions,
      }),
    );
  }

  listServices() {
    return this.db.service.findMany({ orderBy: [{ displayOrder: "asc" }, { key: "asc" }] });
  }
}
