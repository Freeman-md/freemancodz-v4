import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IProjectRepository } from "../interfaces/project.repository.interface";
const include = { cover: { include: { iconBlock: true } } } as const;

export class ProjectRepository implements IProjectRepository {
  constructor(private readonly database: PrismaClient) {}

  findAll() {
    return this.database.project.findMany({ orderBy: { order: "asc" }, include });
  }

  findBySlug(slug: string) {
    return this.database.project.findUnique({ where: { slug }, include });
  }

  findBySlugs(slugs: string[]) {
    return this.database.project.findMany({
      where: { slug: { in: slugs } },
      orderBy: { order: "asc" },
      include,
    });
  }

  findFeatured() {
    return this.database.project.findMany({
      where: { featured: true },
      orderBy: { order: "asc" },
      include,
    });
  }
}
