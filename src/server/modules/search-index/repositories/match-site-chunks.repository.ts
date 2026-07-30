import "server-only";

import { prisma } from "@/server/infrastructure/database/prisma";
import type { MatchSiteChunksRow } from "@/server/modules/search-index/models/search-index";


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

  const rows = await prisma.$queryRaw<MatchSiteChunksRow[]>`
    SELECT *
    FROM match_site_chunks(
      ${vector}::vector,
      ${matchCount},
      ${matchThreshold}
    );
  `;

  return rows;
}
