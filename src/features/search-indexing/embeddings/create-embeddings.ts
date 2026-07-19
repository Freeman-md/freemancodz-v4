import { createOpenAIClient, getEmbeddingModel } from "@/lib/openai";

export type GeneratedEmbedding = {
  embedding: number[];
  embeddingModel: string;
};

export async function createEmbeddings(
  inputs: string[],
): Promise<GeneratedEmbedding[]> {
  if (inputs.length === 0) {
    return [];
  }

  const model = getEmbeddingModel();
  const openai = createOpenAIClient();

  const response = await openai.embeddings.create({
    model,
    input: inputs,
  });

  if (response.data.length !== inputs.length) {
    throw new Error(
      `Expected ${inputs.length} embeddings but received ${response.data.length}.`,
    );
  }

  return response.data.map((item) => ({
    embedding: item.embedding,
    embeddingModel: model,
  }));
}