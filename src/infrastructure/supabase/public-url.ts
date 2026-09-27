const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";

type PublicSupabaseEnvironment = {
  configuredUrl?: string;
  nodeEnvironment?: string;
};

export function resolvePublicSupabaseUrl({
  configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
  nodeEnvironment = process.env.NODE_ENV,
}: PublicSupabaseEnvironment = {}) {
  if (!configuredUrl && nodeEnvironment === "development") {
    return LOCAL_SUPABASE_URL;
  }

  if (!configuredUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required outside local development.");
  }

  let url: URL;

  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP(S) URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP(S) URL.");
  }

  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";

  if (isLocalhost && nodeEnvironment !== "development") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL cannot use localhost outside local development.");
  }

  return url.origin;
}
