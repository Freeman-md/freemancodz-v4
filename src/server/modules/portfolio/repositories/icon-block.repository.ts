import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IIconBlockRepository } from "../interfaces/icon-block.repository.interface";
export class IconBlockRepository implements IIconBlockRepository {
  constructor(private readonly database: PrismaClient) {}

  findById(id: string) {
    return this.database.iconBlock.findUnique({ where: { id } });
  }
}
