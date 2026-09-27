import type { NextConfig } from "next";
import { resolvePublicSupabaseUrl } from "./src/infrastructure/supabase/public-url";

const supabaseUrl = resolvePublicSupabaseUrl();

const supabaseHostname = new URL(supabaseUrl).hostname;

const allowLocalSupabaseImageOptimization =
  process.env.NODE_ENV === "development" &&
  (supabaseHostname === "localhost" || supabaseHostname === "127.0.0.1");

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    proxyClientMaxBodySize: "9mb",
  },
  images: {
    dangerouslyAllowLocalIP: allowLocalSupabaseImageOptimization,
    remotePatterns: [new URL("/storage/v1/object/public/portfolio-media/**", supabaseUrl)],
  },
};

export default nextConfig;
