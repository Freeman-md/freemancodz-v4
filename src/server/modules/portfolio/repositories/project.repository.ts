import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IProjectRepository } from "../interfaces/project.repository.interface";

export class ProjectRepository implements IProjectRepository {
  constructor(private readonly database: PrismaClient) {}

  findAll() {
    return this.database.project.findMany({ orderBy: { position: "asc" } });
  }

  findFeatured() {
    return this.database.project.findMany({
      where: { featured: true },
      orderBy: { position: "asc" },
    });
  }
}
