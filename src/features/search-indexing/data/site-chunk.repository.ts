

import { prisma } from "@/lib/prisma";
import type {
  EmbeddedSiteChunk,
  ExistingSiteChunk,
  IndexableSourceType,
  ReplaceIndexedSourceInput,
} from "@/features/search-indexing/types";

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export function findIndexedChunksBySource(
  sourceType: IndexableSourceType,
  sourceId: string,
): Promise<ExistingSiteChunk[]> {
  return prisma.siteChunk.findMany({
    where: {
      sourceType,
      sourceId,
    },
    select: {
      id: true,
      sourceType: true,
      sourceId: true,
      chunkIndex: true,
      contentHash: true,
      embeddingModel: true,
    },
    orderBy: {
      chunkIndex: "asc",
    },
  });
}

export async function replaceIndexedSource({
  sourceType,
  sourceId,
  upserts,
  obsoleteIds,
}: ReplaceIndexedSourceInput): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    for (const chunk of upserts) {
      await transaction.$executeRaw`
        INSERT INTO site_chunks (
          id,
          "sourceType",
          "sourceId",
          "chunkIndex",
          title,
          category,
          url,
          content,
          keywords,
          embedding,
          "contentHash",
          "embeddingModel",
          "embeddedAt"
        )
        VALUES (
          ${chunk.id},
          ${chunk.sourceType},
          ${chunk.sourceId},
          ${chunk.chunkIndex},
          ${chunk.title},
          ${chunk.category},
          ${chunk.url},
          ${chunk.content},
          ${chunk.keywords},
          ${toVectorLiteral(chunk.embedding)}::vector,
          ${chunk.contentHash},
          ${chunk.embeddingModel},
          ${chunk.embeddedAt}
        )
        ON CONFLICT ("sourceType", "sourceId", "chunkIndex")
        DO UPDATE SET
          id = EXCLUDED.id,
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          url = EXCLUDED.url,
          content = EXCLUDED.content,
          keywords = EXCLUDED.keywords,
          embedding = EXCLUDED.embedding,
          "contentHash" = EXCLUDED."contentHash",
          "embeddingModel" = EXCLUDED."embeddingModel",
          "embeddedAt" = EXCLUDED."embeddedAt",
          "updated_at" = NOW()
      `;
    }

    if (obsoleteIds.length > 0) {
      await transaction.siteChunk.deleteMany({
        where: {
          sourceType,
          sourceId,
          id: {
            in: obsoleteIds,
          },
        },
      });
    }
  });
}

export async function deleteIndexedSource(
  sourceType: IndexableSourceType,
  sourceId: string,
): Promise<number> {
  const result = await prisma.siteChunk.deleteMany({
    where: {
      sourceType,
      sourceId,
    },
  });

  return result.count;
}