import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { MatchSiteChunksRow } from "@/lib/rag/types";

export async function matchSiteChunks(
  queryEmbedding: number[],
  matchCount = 6,
  matchThreshold = 0.25,
): Promise<MatchSiteChunksRow[]> {
  if (queryEmbedding.length !== 1536) {
    throw new Error(
      `matchSiteChunks expected a 1536-length embedding, received ${queryEmbedding.length}.`,
    );
  }

  const vector = `[${queryEmbedding.join(",")}]`;
  return prisma.$queryRaw<MatchSiteChunksRow[]>(Prisma.sql`
    SELECT id, title, category, url, content, keywords,
      (1 - (embedding <=> ${vector}::vector))::float8 AS similarity
    FROM site_chunks WHERE (1 - (embedding <=> ${vector}::vector)) >= ${matchThreshold}
    ORDER BY embedding <=> ${vector}::vector LIMIT ${matchCount}
  `);
}
