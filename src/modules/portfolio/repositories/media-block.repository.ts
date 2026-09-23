import "server-only";
import type { MediaMetadataInput } from "@/contracts/portfolio-admin.contract";
import type { PrismaClient } from "@/generated/prisma/client";
import type { MediaBlockStore } from "../types";
export class MediaBlockRepository implements MediaBlockStore {
  constructor(private readonly database: PrismaClient) {}

  findById(id: string) {
    return this.database.mediaBlock.findUnique({ where: { id }, include: { iconBlock: true } });
  }

  findAll() {
    return this.database.mediaBlock.findMany({
      include: { iconBlock: true },
      orderBy: { id: "asc" },
    });
  }

  async countSourceReferences(source: string) {
    const [profiles, mediaBlocks, projectCovers] = await this.database.$transaction([
      this.database.profile.count({ where: { coverImage: source } }),
      this.database.mediaBlock.count({ where: { source } }),
      this.database.project.count({ where: { cover: { is: { source } } } }),
    ]);

    return profiles + mediaBlocks + projectCovers;
  }

  async create({ type, source, altText, ...base }: MediaMetadataInput & { type: "IMAGE" | "VIDEO"; source: string }) {
    const record = await this.database.iconBlock.create({
      data: { ...base, mediaBlock: { create: { type, source, altText } } },
      select: { id: true },
    });

    return record.id;
  }

  async update(id: string, { altText, ...base }: MediaMetadataInput) {
    await this.database.$transaction([
      this.database.iconBlock.update({ where: { id }, data: base }),
      this.database.mediaBlock.update({ where: { id }, data: { altText } }),
    ]);
  }

  async updateManagedMedia(id: string, source: string, type: "IMAGE" | "VIDEO") {
    await this.database.mediaBlock.update({ where: { id }, data: { source, type } });
  }

  async delete(id: string) {
    await this.database.iconBlock.delete({ where: { id } });
  }
}
