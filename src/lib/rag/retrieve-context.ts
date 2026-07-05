import { createOpenAIClient, getEmbeddingModel } from "@/lib/openai";
import { matchSiteChunks } from "@/lib/rag/match-site-chunks";
import type { MatchSiteChunksRow } from "@/lib/rag/types";

export type RetrievedSource = {
  id: string;
  title: string;
  url: string;
};

export type RetrievedContext = {
  chunks: MatchSiteChunksRow[];
  sources: RetrievedSource[];
};

export async function retrieveContext(
  message: string,
): Promise<RetrievedContext> {
  const openai = createOpenAIClient();
  const embeddingResponse = await openai.embeddings.create({
    model: getEmbeddingModel(),
    input: message,
  });

  const queryEmbedding = embeddingResponse.data[0]?.embedding;

  if (!queryEmbedding) {
    throw new Error("Failed to create query embedding.");
  }

  const chunks = await matchSiteChunks(queryEmbedding, 4, 0.35);
  const sources = chunks.map((chunk) => ({
    id: chunk.id,
    title: chunk.title,
    url: chunk.url,
  }));

  return { chunks, sources };
}
