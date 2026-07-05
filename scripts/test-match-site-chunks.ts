import { createClient } from "@supabase/supabase-js";
import { formatEmbeddingForPgvector } from "../src/lib/rag/format-embedding";
import type { Database } from "../src/types/supabase";

function getRequiredEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SECRET_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const supabase = createClient<Database>(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SECRET_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const dummyVector = Array.from({ length: 1536 }, () => 0);

  const { data, error } = await supabase.rpc("match_site_chunks", {
    query_embedding: formatEmbeddingForPgvector(dummyVector),
    match_count: 4,
    match_threshold: 0.35,
  });

  if (error) {
    throw new Error(`match_site_chunks RPC failed: ${error.message}`);
  }

  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
