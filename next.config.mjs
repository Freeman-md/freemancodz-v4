/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";

const nextConfig = {
  images: {
    remotePatterns: [new URL("/storage/v1/object/public/portfolio-media/**", supabaseUrl)],
  },
};

export default nextConfig;
