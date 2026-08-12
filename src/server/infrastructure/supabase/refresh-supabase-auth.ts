import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSupabaseAuthConfig } from "../config/env";

export async function refreshSupabaseAuth(request: NextRequest) {
  let response = NextResponse.next({ request });

  const config = getSupabaseAuthConfig();

  const client = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(cacheHeaders).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const { data, error } = await client.auth.getClaims();

  response.headers.set("Cache-Control", "private, no-store");

  return { response, claims: error ? null : (data?.claims ?? null) };
}
