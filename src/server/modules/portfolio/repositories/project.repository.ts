import "server-only";
import type { UpsertProjectInput } from "@/contracts/portfolio-admin.contract";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IProjectAdministrationRepository } from "../interfaces/project.repository.interface";
const include = { cover: { include: { iconBlock: true } } } as const;

export class ProjectRepository implements IProjectAdministrationRepository {
  constructor(private readonly database: PrismaClient) {}

  findAll() {
    return this.database.project.findMany({ orderBy: { order: "asc" }, include });
  }

  findBySlug(slug: string) {
    return this.database.project.findUnique({ where: { slug }, include });
  }

  findById(id: string) {
    return this.database.project.findUnique({ where: { id }, include });
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

  async create(input: UpsertProjectInput) {
    return (await this.database.project.create({ data: input, select: { id: true } })).id;
  }

  async update(id: string, input: UpsertProjectInput) {
    await this.database.$transaction(async (transaction) => {
      const current = await transaction.project.findUniqueOrThrow({
        where: { id },
        select: { order: true },
      });

      if (current.order === input.order) {
        await transaction.project.update({ where: { id }, data: input });

        return;
      }

      const occupant = await transaction.project.findUnique({
        where: { order: input.order },
        select: { id: true },
      });

      await transaction.project.update({ where: { id }, data: { order: -2_147_483_648 } });
      if (occupant) {
        await transaction.project.update({
          where: { id: occupant.id },
          data: { order: current.order },
        });
      }

      await transaction.project.update({ where: { id }, data: input });
    });
  }

  async delete(id: string) {
    await this.database.project.delete({ where: { id } });
  }
}
