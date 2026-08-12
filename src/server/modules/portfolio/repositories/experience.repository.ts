import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IExperienceRepository } from "../interfaces/experience.repository.interface";
export class ExperienceRepository implements IExperienceRepository {
  constructor(private readonly database: PrismaClient) {}

  findAll() {
    return this.database.experience.findMany({
      orderBy: { order: "asc" },
      include: { iconBlocks: { orderBy: { order: "asc" }, include: { iconBlock: true } } },
    });
  }
}
