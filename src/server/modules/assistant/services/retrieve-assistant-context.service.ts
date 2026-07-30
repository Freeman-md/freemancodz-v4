import "server-only";

import { createOpenAIClient, getEmbeddingModel } from "@/server/infrastructure/openai/openai-client";
import { searchSiteIndex } from "@/server/modules/search-index/public";
import type { MatchSiteChunksRow } from "@/server/modules/search-index/public";

export type RetrievedSource = {
  id: string;
  title: string;
  url: string;
};

export type RetrievedContext = {
  chunks: MatchSiteChunksRow[];
  sources: RetrievedSource[];
};

function expandRetrievalQuery(message: string) {
  return `
User question:
${message}

Retrieve information about:
- Freeman's projects and engineering work
- technical experience and skills
- systems, architectures and technologies built
- professional background and achievements
`;
}

export async function retrieveContext(
  message: string,
): Promise<RetrievedContext> {
  const openai = createOpenAIClient();
  const embeddingResponse = await openai.embeddings.create({
    model: getEmbeddingModel(),
    input: expandRetrievalQuery(message),
  });

  const queryEmbedding = embeddingResponse.data[0]?.embedding;

  if (!queryEmbedding) {
    throw new Error("Failed to create query embedding.");
  }

  const chunks = await searchSiteIndex(queryEmbedding);
  const sources = chunks.map((chunk) => ({
    id: chunk.id,
    title: chunk.title,
    url: chunk.url,
  }));

  return { chunks, sources };
}
