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

function expandRetrievalQuery(message: string) {
  const normalized = message.toLowerCase();
  const hints: string[] = [];

  if (
    normalized.includes("project") ||
    normalized.includes("worked on") ||
    normalized.includes("built")
  ) {
    hints.push("portfolio projects product work software projects Freeman worked on");
  }

  if (
    normalized.includes("automation") ||
    normalized.includes("ai") ||
    normalized.includes("assistant")
  ) {
    hints.push("automation AI systems backend worker internal operations assistant");
  }

  if (
    normalized.includes("how good") ||
    normalized.includes("good is he") ||
    normalized.includes("strong")
  ) {
    hints.push("skills experience strengths engineering principles reliability software engineer");
  }

  if (
    normalized.includes("years of experience") ||
    normalized.includes("experience") ||
    normalized.includes("work history")
  ) {
    hints.push("experience dates timeline work history education commercial work");
  }

  if (hints.length === 0) {
    return message;
  }

  return `${message}\n\nRetrieval hints: ${hints.join("; ")}`;
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

  const chunks = await matchSiteChunks(queryEmbedding, 6, 0.25);
  const sources = chunks.map((chunk) => ({
    id: chunk.id,
    title: chunk.title,
    url: chunk.url,
  }));

  return { chunks, sources };
}
