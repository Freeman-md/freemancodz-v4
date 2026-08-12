import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IActionBlockAdministrationRepository } from "../interfaces/action-block.repository.interface";
import type { UpsertActionBlockInput } from "../models/portfolio-administration";
export class ActionBlockRepository implements IActionBlockAdministrationRepository {
  constructor(private readonly database: PrismaClient) {}

  findById(id: string) {
    return this.database.actionBlock.findUnique({ where: { id }, include: { iconBlock: true } });
  }

  findAll() {
    return this.database.actionBlock.findMany({
      include: { iconBlock: true },
      orderBy: { id: "asc" },
    });
  }

  async create({ variant, url, assistantMessage, ...base }: UpsertActionBlockInput) {
    const record = await this.database.iconBlock.create({
      data: { ...base, actionBlock: { create: { variant, url, assistantMessage } } },
      select: { id: true },
    });

    return record.id;
  }

  async update(id: string, { variant, url, assistantMessage, ...base }: UpsertActionBlockInput) {
    await this.database.$transaction([
      this.database.iconBlock.update({ where: { id }, data: base }),
      this.database.actionBlock.update({ where: { id }, data: { variant, url, assistantMessage } }),
    ]);
  }

  async delete(id: string) {
    await this.database.iconBlock.delete({ where: { id } });
  }
}
