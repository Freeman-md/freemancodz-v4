import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IPrincipleRepository } from "../interfaces/principle.repository.interface";

export class PrincipleRepository implements IPrincipleRepository {
  constructor(private readonly database: PrismaClient) {}

  findBySection(section: string) {
    return this.database.principle.findMany({ where: { section }, orderBy: { position: "asc" } });
  }
}
