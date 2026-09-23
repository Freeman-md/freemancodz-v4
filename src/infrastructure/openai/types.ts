import type { ResponseStreamEvent } from "openai/resources/responses/responses";

export type OpenAIResponseInputItem =
  | { type: "user_message"; content: string }
  | { type: "function_call_output"; callId: string; output: string };

export type OpenAIResponseTool = {
  type: "function";
  name: string;
  description: string;
  strict: true;
  parameters: Record<string, unknown>;
};

export type OpenAIResponseRequest = {
  input: OpenAIResponseInputItem[];
  instructions: string;
  tools: OpenAIResponseTool[];
  previousResponseId: string | null;
  signal: AbortSignal;
};

export type GeneratedEmbedding = { embedding: number[]; embeddingModel: string };

export type OpenAITransport = {
  streamResponse(request: OpenAIResponseRequest): Promise<AsyncIterable<ResponseStreamEvent>>;
  createEmbedding(input: string): Promise<number[] | undefined>;
  createEmbeddings(inputs: string[]): Promise<GeneratedEmbedding[]>;
  getEmbeddingModel(): string;
};
