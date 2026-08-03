import type { ResponseStreamEvent } from "openai/resources/responses/responses";
import type { OpenAIResponseRequest } from "../models/openai-response-request";

export type GeneratedEmbedding = { embedding: number[]; embeddingModel: string };

export interface IOpenAIProvider {
  streamResponse(request: OpenAIResponseRequest): Promise<AsyncIterable<ResponseStreamEvent>>;
  createEmbedding(input: string): Promise<number[] | undefined>;
  createEmbeddings(inputs: string[]): Promise<GeneratedEmbedding[]>;
  getEmbeddingModel(): string;
}
