import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IMediaBlockAdministrationRepository } from "../interfaces/media-block.repository.interface";
import type { UpsertMediaBlockInput } from "../models/portfolio-administration";
export class MediaBlockRepository implements IMediaBlockAdministrationRepository {
  constructor(private readonly database: PrismaClient) {}

  findById(id: string) {
    return this.database.mediaBlock.findUnique({ where: { id }, include: { iconBlock: true } });
  }

  findAll() {
    return this.database.mediaBlock.findMany({ include: { iconBlock: true }, orderBy: { id: "asc" } });
  }

  async countSourceReferences(source: string) {
    const [profiles, mediaBlocks, projectCovers] = await this.database.$transaction([
      this.database.profile.count({ where: { coverImage: source } }),
      this.database.mediaBlock.count({ where: { source } }),
      this.database.project.count({ where: { cover: { is: { source } } } }),
    ]);

    return profiles + mediaBlocks + projectCovers;
  }

  async create({ type, source, altText, ...base }: UpsertMediaBlockInput) {
    const record = await this.database.iconBlock.create({
      data: { ...base, mediaBlock: { create: { type, source, altText } } },
      select: { id: true },
    });

    return record.id;
  }

  async update(id: string, { type, source, altText, ...base }: UpsertMediaBlockInput) {
    await this.database.$transaction([
      this.database.iconBlock.update({ where: { id }, data: base }),
      this.database.mediaBlock.update({ where: { id }, data: { type, source, altText } }),
    ]);
  }

  async updateSource(id: string, source: string) {
    await this.database.mediaBlock.update({ where: { id }, data: { source } });
  }

  async delete(id: string) {
    await this.database.iconBlock.delete({ where: { id } });
  }
}
