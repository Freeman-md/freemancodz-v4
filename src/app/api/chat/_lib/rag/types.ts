import type { Database } from "@/types/supabase";

export type MatchSiteChunksRow =
  Database["public"]["Functions"]["match_site_chunks"]["Returns"][number];
