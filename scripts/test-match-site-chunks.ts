import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getEnv } from "../src/lib/config/env";
import type { Database } from "../src/types/supabase";

loadEnv({ path: ".env.local" });

async function main() {
  const { supabase: supabaseEnv } = getEnv();

  const supabase = createClient<Database>(
    supabaseEnv.url,
    supabaseEnv.secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const dummyVector = Array.from({ length: 1536 }, () => 0);

  const { data, error } = await supabase.rpc("match_site_chunks", {
    query_embedding: `${dummyVector.join(",")}`,
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
