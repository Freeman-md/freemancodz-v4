import type { IOpenAIProvider } from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import type { ISiteSearchService } from "@/server/modules/search-index/public";
import type { SearchWebsiteInput } from "../schemas/tools/search-website.schema";

export async function searchWebsite(
  input: SearchWebsiteInput,
  dependencies: { openai: IOpenAIProvider; siteSearch: ISiteSearchService },
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
