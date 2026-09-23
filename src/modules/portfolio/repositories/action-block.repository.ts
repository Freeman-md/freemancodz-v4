import "server-only";
import type { UpsertActionBlockInput } from "@/contracts/portfolio-admin.contract";
import type { PrismaClient } from "@/generated/prisma/client";
import type { ActionBlockStore } from "../types";
export class ActionBlockRepository implements ActionBlockStore {
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
