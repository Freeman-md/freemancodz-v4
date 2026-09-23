import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  getSupabaseAdminAuthConfig,
  getSupabaseAuthConfig,
  getSupabaseStorageConfig,
} from "../config/env";

export function createSupabaseStorageClient() {
  const config = getSupabaseStorageConfig();

  return createClient(config.url, config.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createSupabaseAdminAuthClient() {
  const config = getSupabaseAdminAuthConfig();

  return createClient(config.url, config.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createSupabaseAuthClient() {
  const cookieStore = await cookies();

  const config = getSupabaseAuthConfig();

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write response cookies. Proxy refreshes them.
        }
      },
    },
  });
}
