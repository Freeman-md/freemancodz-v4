import type {
  FunctionTool,
  ResponseInput,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";

export type GeneratedEmbedding = { embedding: number[]; embeddingModel: string };

export type OpenAIResponseRequest = {
  input: ResponseInput;
  instructions: string;
  tools: FunctionTool[];
  previousResponseId: string | null;
  signal: AbortSignal;
};

export interface IOpenAIProvider {
  streamResponse(request: OpenAIResponseRequest): Promise<AsyncIterable<ResponseStreamEvent>>;
  createEmbedding(input: string): Promise<number[] | undefined>;
  createEmbeddings(inputs: string[]): Promise<GeneratedEmbedding[]>;
  getEmbeddingModel(): string;
}
