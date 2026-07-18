import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { MatchSiteChunksRow } from "@/lib/rag/types";
import { assertQueryEmbeddingLength } from "./retrieval-validation";

export async function matchSiteChunks(
  queryEmbedding: number[],
  matchCount = 6,
  matchThreshold = 0.25,
): Promise<MatchSiteChunksRow[]> {
  assertQueryEmbeddingLength(queryEmbedding);

  const vector = `[${queryEmbedding.join(",")}]`;
  return prisma.$queryRaw<MatchSiteChunksRow[]>(Prisma.sql`
    SELECT id, title, category, url, content, keywords,
      (1 - (embedding <=> ${vector}::vector))::float8 AS similarity
    FROM site_chunks WHERE (1 - (embedding <=> ${vector}::vector)) >= ${matchThreshold}
    ORDER BY embedding <=> ${vector}::vector LIMIT ${matchCount}
  `);
}
