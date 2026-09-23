import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminAuthConfig } from "../config/env";

export function createSupabaseAdminAuthClient() {
  const config = getSupabaseAdminAuthConfig();

  return createClient(config.url, config.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
