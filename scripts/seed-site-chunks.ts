import { config as loadEnv } from "dotenv";
import { getEnv } from "../src/lib/config/env";
import { buildSiteChunks, chunkToEmbeddingInput } from "../src/lib/rag/build-site-chunks";
import type { Database } from "../src/types/supabase";

loadEnv({ path: ".env.local" });

type SiteChunkInsert = Database["public"]["Tables"]["site_chunks"]["Insert"];

async function main() {
  getEnv();

  const { createOpenAIClient, getEmbeddingModel } = await import(
    "../src/lib/openai"
  );
  const { createServerSupabaseClient } = await import(
    "../src/lib/supabase/server"
  );

  const openai = createOpenAIClient();
  const supabase = createServerSupabaseClient();
  const chunks = buildSiteChunks();
  const embeddingModel = getEmbeddingModel();

  console.log(`Seeding ${chunks.length} chunks with model ${embeddingModel}`);

  const rows: SiteChunkInsert[] = [];

  for (const [index, chunk] of chunks.entries()) {
    console.log(`[${index + 1}/${chunks.length}] Embedding ${chunk.id}`);

    const embeddingResponse = await openai.embeddings.create({
      model: embeddingModel,
      input: chunkToEmbeddingInput(chunk),
    });

    const embedding = embeddingResponse.data[0]?.embedding;

    if (!embedding) {
      throw new Error(`No embedding returned for chunk ${chunk.id}`);
    }

    rows.push({
      id: chunk.id,
      title: chunk.title,
      category: chunk.category,
      url: chunk.url,
      content: chunk.content,
      keywords: chunk.keywords,
      embedding: `[${embedding.join(",")}]`,
    });
  }

  const { error } = await supabase.from("site_chunks").upsert(rows);

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  console.log(`Seeded ${rows.length} chunks into site_chunks`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
