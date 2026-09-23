import { z } from "zod";

import type { OpenAITransport } from "@/infrastructure/openai/types";
import type { SiteSearch } from "@/modules/search-index/types";
export const searchWebsiteSchema = z
  .object({ query: z.string().trim().min(1).max(500) })
  .strict();

type SearchWebsiteInput = z.infer<typeof searchWebsiteSchema>;

export async function searchWebsite(
  input: SearchWebsiteInput,
  dependencies: { openai: OpenAITransport; siteSearch: SiteSearch },
) {
  const embedding = await dependencies.openai.createEmbedding(input.query);

  if (!embedding) {
    throw new Error("Search embedding was unavailable.");
  }

  const chunks = await dependencies.siteSearch.search(embedding);

  return {
    chunks: chunks.map((chunk) => ({
      id: chunk.id,
      title: chunk.title,
      url: chunk.url,
      category: chunk.category,
      keywords: chunk.keywords,
      content: chunk.content,
    })),
    sources: chunks.map((chunk) => ({ id: chunk.id, title: chunk.title, url: chunk.url })),
  };
}
