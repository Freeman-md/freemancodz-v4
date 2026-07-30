import "server-only";

import { createOpenAIClient, getEmbeddingModel } from "@/server/infrastructure/openai/openai-client";

export async function createAssistantQueryEmbedding(input: string) {
  const response = await createOpenAIClient().embeddings.create({ model: getEmbeddingModel(), input });
  return response.data[0]?.embedding;
}
