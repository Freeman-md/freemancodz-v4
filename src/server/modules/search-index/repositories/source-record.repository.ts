import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type {
  ISourceRecordRepository,
  SourceRecord,
} from "../interfaces/source-record.repository.interface";
import type { IndexableSourceType } from "../mappers/source-document.mapper";

export class SourceRecordRepository implements ISourceRecordRepository {
  constructor(private readonly database: PrismaClient) {}

  async findById(sourceType: IndexableSourceType, sourceId: string): Promise<SourceRecord | null> {
    switch (sourceType) {
      case "content_blocks": {
        const record = await this.database.contentBlock.findUnique({ where: { id: sourceId } });

        return record ? { sourceType, record } : null;
      }

      case "projects": {
        const record = await this.database.project.findUnique({ where: { id: sourceId } });

        return record ? { sourceType, record } : null;
      }

      case "services": {
        const record = await this.database.service.findUnique({ where: { id: sourceId } });

        return record ? { sourceType, record } : null;
      }

      case "principles": {
        const record = await this.database.principle.findUnique({ where: { id: sourceId } });

        return record ? { sourceType, record } : null;
      }

      case "experiences": {
        const record = await this.database.experience.findUnique({ where: { id: sourceId } });

        return record ? { sourceType, record } : null;
      }
    }
  }

  async findAll(): Promise<SourceRecord[]> {
    const [contentBlocks, projects, services, principles, experiences] = await Promise.all([
      this.database.contentBlock.findMany({ orderBy: { position: "asc" } }),
      this.database.project.findMany({ orderBy: { position: "asc" } }),
      this.database.service.findMany({ orderBy: { position: "asc" } }),
      this.database.principle.findMany({ orderBy: { position: "asc" } }),
      this.database.experience.findMany({ orderBy: { position: "asc" } }),
    ]);

    return [
      ...contentBlocks.map((record): SourceRecord => ({ sourceType: "content_blocks", record })),
      ...projects.map((record): SourceRecord => ({ sourceType: "projects", record })),
      ...services.map((record): SourceRecord => ({ sourceType: "services", record })),
      ...principles.map((record): SourceRecord => ({ sourceType: "principles", record })),
      ...experiences.map((record): SourceRecord => ({ sourceType: "experiences", record })),
    ];
  }
}
