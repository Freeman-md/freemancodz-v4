import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { IndexableSourceType } from "../types";

export type StoredChunk = { id: string; contentHash: string | null; embeddingModel: string | null };
export type ChunkWrite = StoredChunk & { sourceType: IndexableSourceType; sourceId: string; chunkIndex: number; title: string; category: string; url: string; content: string; keywords: string[]; embedding: number[]; embeddedAt: Date };

export function findSourceChunks(sourceType: IndexableSourceType, sourceId: string) {
  return prisma.siteChunk.findMany({ where: { sourceType, sourceId }, select: { id: true, contentHash: true, embeddingModel: true } });
}

export async function writeSourceChunks(writes: ChunkWrite[], obsoleteIds: string[]) {
  await prisma.$transaction(async (tx) => {
    for (const chunk of writes) {
      const vector = `[${chunk.embedding.join(",")}]`;
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "site_chunks" ("id", "sourceType", "sourceId", "chunkIndex", "title", "category", "url", "content", "keywords", "embedding", "contentHash", "embeddingModel", "embeddedAt", "updated_at")
        VALUES (${chunk.id}, ${chunk.sourceType}, ${chunk.sourceId}, ${chunk.chunkIndex}, ${chunk.title}, ${chunk.category}, ${chunk.url}, ${chunk.content}, ${chunk.keywords}, ${vector}::vector, ${chunk.contentHash}, ${chunk.embeddingModel}, ${chunk.embeddedAt}, NOW())
        ON CONFLICT ("sourceType", "sourceId", "chunkIndex") DO UPDATE SET
          "id" = EXCLUDED."id", "title" = EXCLUDED."title", "category" = EXCLUDED."category", "url" = EXCLUDED."url", "content" = EXCLUDED."content", "keywords" = EXCLUDED."keywords", "embedding" = EXCLUDED."embedding", "contentHash" = EXCLUDED."contentHash", "embeddingModel" = EXCLUDED."embeddingModel", "embeddedAt" = EXCLUDED."embeddedAt", "updated_at" = NOW()
      `);
    }
    if (obsoleteIds.length) await tx.siteChunk.deleteMany({ where: { id: { in: obsoleteIds } } });
  });
}

export function deleteSourceChunks(sourceType: IndexableSourceType, sourceId: string) {
  return prisma.siteChunk.deleteMany({ where: { sourceType, sourceId } });
}
