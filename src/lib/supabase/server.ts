import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/config/env";
import type { Database } from "@/types/supabase";

export function createServerSupabaseClient() {
  const { supabase } = getEnv();

  return createClient<Database>(supabase.url, supabase.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
