import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IActionBlockRepository } from "../interfaces/action-block.repository.interface";
export class ActionBlockRepository implements IActionBlockRepository {
  constructor(private readonly database: PrismaClient) {}

  findById(id: string) {
    return this.database.actionBlock.findUnique({ where: { id }, include: { iconBlock: true } });
  }
}
