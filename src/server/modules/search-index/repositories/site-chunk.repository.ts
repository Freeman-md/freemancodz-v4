import "server-only";



import type { PrismaClient } from "@/generated/prisma/client";
import type { ISiteChunkRepository } from "../interfaces/site-chunk.repository.interface";
import type {
  EmbeddedSiteChunk,
  ExistingSiteChunk,
  IndexableSourceType,
  ReplaceIndexedSourceInput,
} from "@/server/modules/search-index/models/search-index";

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export class SiteChunkRepository implements ISiteChunkRepository {
  constructor(private readonly database: PrismaClient) {}
findBySource(
  sourceType: IndexableSourceType,
  sourceId: string,
): Promise<ExistingSiteChunk[]> {
  return this.database.siteChunk.findMany({
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

async replaceSource({
  sourceType,
  sourceId,
  upserts,
  obsoleteIds,
}: ReplaceIndexedSourceInput): Promise<void> {
  await this.database.$transaction(async (transaction) => {
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

async deleteSource(
  sourceType: IndexableSourceType,
  sourceId: string,
): Promise<number> {
  const result = await this.database.siteChunk.deleteMany({
    where: {
      sourceType,
      sourceId,
    },
  });

  return result.count;
}

async match(queryEmbedding: number[], matchCount = 6, matchThreshold = 0.25) {
  if (queryEmbedding.length !== 1536) throw new Error(`matchSiteChunks expected a 1536-length embedding, received ${queryEmbedding.length}.`);
  const vector = `[${queryEmbedding.join(",")}]`;
  return this.database.$queryRaw<import("../models/search-index").MatchSiteChunksRow[]>`SELECT * FROM match_site_chunks(${vector}::vector, ${matchCount}, ${matchThreshold});`;
}
}
