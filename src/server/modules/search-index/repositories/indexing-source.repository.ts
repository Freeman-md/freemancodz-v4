import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type { IIndexingSourceRepository } from "../interfaces/indexing-source.repository.interface";
import type {
  IndexableSource,
  IndexableSourceType,
} from "@/server/modules/search-index/models/search-index";

export class IndexingSourceRepository implements IIndexingSourceRepository {
  constructor(private readonly database: PrismaClient) { }
  async findById(
    sourceType: IndexableSourceType,
    sourceId: string,
  ): Promise<IndexableSource | null> {
    switch (sourceType) {
      case "content_blocks": {
        const record = await this.database.contentBlock.findUnique({
          where: { id: sourceId },
        });

        return record
          ? {
            sourceType,
            record,
          }
          : null;
      }

      case "projects": {
        const record = await this.database.project.findUnique({
          where: { id: sourceId },
        });

        return record
          ? {
            sourceType,
            record,
          }
          : null;
      }

      case "services": {
        const record = await this.database.service.findUnique({
          where: { id: sourceId },
        });

        return record
          ? {
            sourceType,
            record,
          }
          : null;
      }

      case "principles": {
        const record = await this.database.principle.findUnique({
          where: { id: sourceId },
        });

        return record
          ? {
            sourceType,
            record,
          }
          : null;
      }

      case "experiences": {
        const record = await this.database.experience.findUnique({
          where: { id: sourceId },
        });

        return record
          ? {
            sourceType,
            record,
          }
          : null;
      }
    }
  }

  async findAll(): Promise<IndexableSource[]> {
    const [
      contentBlocks,
      projects,
      services,
      principles,
      experiences,
    ] = await Promise.all([
      this.database.contentBlock.findMany({
        orderBy: { position: "asc" },
      }),
      this.database.project.findMany({
        orderBy: { position: "asc" },
      }),
      this.database.service.findMany({
        orderBy: { position: "asc" },
      }),
      this.database.principle.findMany({
        orderBy: { position: "asc" },
      }),
      this.database.experience.findMany({
        orderBy: { position: "asc" },
      }),
    ]);

    return [
      ...contentBlocks.map(
        (record): IndexableSource => ({
          sourceType: "content_blocks",
          record,
        }),
      ),
      ...projects.map(
        (record): IndexableSource => ({
          sourceType: "projects",
          record,
        }),
      ),
      ...services.map(
        (record): IndexableSource => ({
          sourceType: "services",
          record,
        }),
      ),
      ...principles.map(
        (record): IndexableSource => ({
          sourceType: "principles",
          record,
        }),
      ),
      ...experiences.map(
        (record): IndexableSource => ({
          sourceType: "experiences",
          record,
        }),
      ),
    ];
  }
}
