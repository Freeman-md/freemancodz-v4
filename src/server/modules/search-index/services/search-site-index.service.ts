import type { MatchSiteChunksRow } from "@/server/modules/search-index/models/search-index";
import { matchSiteChunks } from "../repositories/match-site-chunks.repository";


export function diversifyChunks(
  chunks: MatchSiteChunksRow[],
  limit = 6,
): MatchSiteChunksRow[] {
  const seen = new Set<string>();
  const diversified: MatchSiteChunksRow[] = [];

  for (const chunk of chunks) {
    const key = `${chunk.title.trim().toLowerCase()}|${chunk.url}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    diversified.push(chunk);

    if (diversified.length === limit) {
      break;
    }
  }

  return diversified;
}

export async function searchSiteIndex(queryEmbedding: number[]) {
  return diversifyChunks(await matchSiteChunks(queryEmbedding, 20, 0.25), 6);
}
