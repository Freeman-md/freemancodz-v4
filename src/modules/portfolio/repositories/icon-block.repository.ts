import "server-only";
import type { UpsertIconBlockInput } from "@/contracts/portfolio-admin.contract";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IconBlockStore } from "../types";
export class IconBlockRepository implements IconBlockStore {
  constructor(private readonly database: PrismaClient) {}

  findById(id: string) {
    return this.database.iconBlock.findUnique({ where: { id } });
  }

  findAll() {
    return this.database.iconBlock.findMany({ orderBy: [{ label: "asc" }, { id: "asc" }] });
  }

  async create(input: UpsertIconBlockInput) {
    return (await this.database.iconBlock.create({ data: input, select: { id: true } })).id;
  }

  async update(id: string, input: UpsertIconBlockInput) {
    await this.database.iconBlock.update({ where: { id }, data: input });
  }

  async delete(id: string) {
    await this.database.iconBlock.delete({ where: { id } });
  }

  async countReferences(id: string) {
    const [iconLinks, actionLinks, mediaLinks, profileCollections, experiences, projectCovers] =
      await Promise.all([
        this.database.contentBlockIconBlock.count({ where: { iconBlockId: id } }),
        this.database.contentBlockActionBlock.count({ where: { actionBlockId: id } }),
        this.database.contentBlockMediaBlock.count({ where: { mediaBlockId: id } }),
        this.database.profileIconBlock.count({ where: { iconBlockId: id } }),
        this.database.experienceIconBlock.count({ where: { iconBlockId: id } }),
        this.database.project.count({ where: { coverId: id } }),
      ]);

    return {
      contentBlocks: iconLinks + actionLinks + mediaLinks,
      profileCollections,
      experiences,
      projectCovers,
    };
  }
}
