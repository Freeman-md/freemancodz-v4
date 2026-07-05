import "server-only";

import { formatEmbeddingForPgvector } from "@/lib/rag/format-embedding";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MatchSiteChunksRow } from "@/lib/rag/types";

export async function matchSiteChunks(
  queryEmbedding: number[],
  matchCount = 4,
  matchThreshold = 0.35,
): Promise<MatchSiteChunksRow[]> {
  if (queryEmbedding.length !== 1536) {
    throw new Error(
      `matchSiteChunks expected a 1536-length embedding, received ${queryEmbedding.length}.`,
    );
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("match_site_chunks", {
    query_embedding: formatEmbeddingForPgvector(queryEmbedding),
    match_count: matchCount,
    match_threshold: matchThreshold,
  });

  if (error) {
    throw new Error(`match_site_chunks RPC failed: ${error.message}`);
  }

  return data satisfies MatchSiteChunksRow[];
}
