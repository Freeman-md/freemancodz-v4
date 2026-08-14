import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseStorageConfig } from "../config/env";

export function createSupabaseStorageClient() {
  const config = getSupabaseStorageConfig();

  return createClient(config.url, config.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
