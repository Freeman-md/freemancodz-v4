import { createOpenAIClient, getEmbeddingModel } from "@/lib/openai";
import { matchSiteChunks } from "./match-site-chunks";
import type { MatchSiteChunksRow } from "../types";
import { diversifyChunks } from "./diversify-chunk";

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

  const candidates = await matchSiteChunks(queryEmbedding, 20, 0.25);
  const chunks = diversifyChunks(candidates, 6);
  const sources = chunks.map((chunk) => ({
    id: chunk.id,
    title: chunk.title,
    url: chunk.url,
  }));

  return { chunks, sources };
}
