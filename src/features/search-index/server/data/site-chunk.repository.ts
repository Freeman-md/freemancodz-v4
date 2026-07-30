import "server-only";



import { prisma } from "@/server/infrastructure/database/prisma";
import type {
  EmbeddedSiteChunk,
  ExistingSiteChunk,
  IndexableSourceType,
  ReplaceIndexedSourceInput,
} from "@/features/search-index/types";

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
          source_type,
          source_id,
          chunk_index,
          title,
          category,
          url,
          content,
          keywords,
          embedding,
          content_hash,
          embedding_model,
          embedded_at
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
        ON CONFLICT (source_type, source_id, chunk_index)
        DO UPDATE SET
          id = EXCLUDED.id,
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          url = EXCLUDED.url,
          content = EXCLUDED.content,
          keywords = EXCLUDED.keywords,
          embedding = EXCLUDED.embedding,
          content_hash = EXCLUDED.content_hash,
          embedding_model = EXCLUDED.embedding_model,
          embedded_at = EXCLUDED.embedded_at,
          updated_at = NOW()
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
