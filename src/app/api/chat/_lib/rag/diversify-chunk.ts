import type { MatchSiteChunksRow } from "./types";

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