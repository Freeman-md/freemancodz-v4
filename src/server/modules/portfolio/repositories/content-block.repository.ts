import "server-only";
import type { ContentPage, ContentSection } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";
import type { IContentBlockRepository } from "../interfaces/content-block.repository.interface";

export class ContentBlockRepository implements IContentBlockRepository {
  constructor(private readonly database: PrismaClient) {}
  async findRequiredByKey(key: string) {
    const block = await this.database.contentBlock.findUnique({ where: { key } });
    if (!block) throw new Error(`Required content block not found: ${key}`);
    return block;
  }
  findBySection(page: ContentPage, section: ContentSection) { return this.database.contentBlock.findMany({ where: { page, section }, orderBy: { position: "asc" } }); }
}
