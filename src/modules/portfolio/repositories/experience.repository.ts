import "server-only";
import type {
  OrderedRelationInput,
  UpsertExperienceInput,
} from "@/contracts/portfolio-admin.contract";
import type { PrismaClient } from "@/generated/prisma/client";
import type { ExperienceStore } from "../types";
export class ExperienceRepository implements ExperienceStore {
  constructor(private readonly database: PrismaClient) {}

  findAll() {
    return this.database.experience.findMany({
      orderBy: { order: "asc" },
      include: { iconBlocks: { orderBy: { order: "asc" }, include: { iconBlock: true } } },
    });
  }

  async create(input: UpsertExperienceInput) {
    return (await this.database.experience.create({ data: input, select: { id: true } })).id;
  }

  async update(id: string, input: UpsertExperienceInput) {
    await this.database.$transaction(async (transaction) => {
      const current = await transaction.experience.findUniqueOrThrow({
        where: { id },
        select: { order: true },
      });

      if (current.order === input.order) {
        await transaction.experience.update({ where: { id }, data: input });

        return;
      }

      const occupant = await transaction.experience.findUnique({
        where: { order: input.order },
        select: { id: true },
      });

      await transaction.experience.update({ where: { id }, data: { order: -2_147_483_648 } });
      if (occupant) {
        await transaction.experience.update({
          where: { id: occupant.id },
          data: { order: current.order },
        });
      }

      await transaction.experience.update({ where: { id }, data: input });
    });
  }

  async replaceIcons(experienceId: string, icons: OrderedRelationInput[]) {
    await this.database.$transaction(async (transaction) => {
      await transaction.experienceIconBlock.deleteMany({ where: { experienceId } });
      if (icons.length > 0) {
        await transaction.experienceIconBlock.createMany({
          data: icons.map(({ id: iconBlockId, order }) => ({ experienceId, iconBlockId, order })),
        });
      }
    });
  }

  async delete(id: string) {
    await this.database.experience.delete({ where: { id } });
  }
}
