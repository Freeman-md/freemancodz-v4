import "server-only";

import { prisma } from "@/server/infrastructure/database/prisma";
import type {
  IndexableSource,
  IndexableSourceType,
} from "@/features/search-index/types";

export async function findIndexableSource(
  sourceType: IndexableSourceType,
  sourceId: string,
): Promise<IndexableSource | null> {
  switch (sourceType) {
    case "content_blocks": {
      const record = await prisma.contentBlock.findUnique({
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
      const record = await prisma.project.findUnique({
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
      const record = await prisma.service.findUnique({
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
      const record = await prisma.principle.findUnique({
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
      const record = await prisma.experience.findUnique({
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

export async function findAllIndexableSources(): Promise<IndexableSource[]> {
  const [
    contentBlocks,
    projects,
    services,
    principles,
    experiences,
  ] = await Promise.all([
    prisma.contentBlock.findMany({
      orderBy: { position: "asc" },
    }),
    prisma.project.findMany({
      orderBy: { position: "asc" },
    }),
    prisma.service.findMany({
      orderBy: { position: "asc" },
    }),
    prisma.principle.findMany({
      orderBy: { position: "asc" },
    }),
    prisma.experience.findMany({
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
