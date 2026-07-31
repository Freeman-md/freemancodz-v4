import type { ResponseStreamEvent } from "openai/resources/responses/responses";

export type GeneratedEmbedding = { embedding: number[]; embeddingModel: string };

export interface IOpenAIProvider {
  streamResponse(input: string, instructions: string, previousResponseId: string | null, signal: AbortSignal): Promise<AsyncIterable<ResponseStreamEvent>>;
  createEmbedding(input: string): Promise<number[] | undefined>;
  createEmbeddings(inputs: string[]): Promise<GeneratedEmbedding[]>;
  getEmbeddingModel(): string;
}
