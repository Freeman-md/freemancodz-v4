import type { NextConfig } from "next";
import { resolvePublicSupabaseUrl } from "./src/shared/config/public-supabase-url";

const supabaseUrl = resolvePublicSupabaseUrl();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL("/storage/v1/object/public/portfolio-media/**", supabaseUrl)],
  },
};

export default nextConfig;
