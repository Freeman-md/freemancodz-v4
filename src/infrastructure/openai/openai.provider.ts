import "server-only";

import type OpenAI from "openai";
import type { FunctionTool, ResponseInput } from "openai/resources/responses/responses";
import type { IOpenAIProvider, GeneratedEmbedding } from "./interfaces/openai.provider.interface";
import type {
  OpenAIResponseInputItem,
  OpenAIResponseRequest,
  OpenAIResponseTool,
} from "./models/openai-response-request";

export class OpenAIProvider implements IOpenAIProvider {
  constructor(
    private readonly createClient: () => OpenAI,
    private readonly getEmbeddingModelName: () => string,
    private readonly getResponseModelName: () => string,
  ) {}

  streamResponse(request: OpenAIResponseRequest) {
    return this.createClient().responses.create(
      {
        model: this.getResponseModelName(),
        instructions: request.instructions,
        input: this.toResponseInput(request.input),
        tools: this.toFunctionTools(request.tools),
        previous_response_id: request.previousResponseId,
        store: true,
        stream: true,
      },
      { signal: request.signal },
    );
  }

  async createEmbedding(input: string) {
    const response = await this.createClient().embeddings.create({
      model: this.getEmbeddingModelName(),
      input,
    });

    return response.data[0]?.embedding;
  }

  async createEmbeddings(inputs: string[]): Promise<GeneratedEmbedding[]> {
    if (inputs.length === 0) {
      return [];
    }

    const embeddingModel = this.getEmbeddingModelName();

    const response = await this.createClient().embeddings.create({
      model: embeddingModel,
      input: inputs,
    });

    if (response.data.length !== inputs.length) {
      throw new Error(`Expected ${inputs.length} embeddings but received ${response.data.length}.`);
    }

    return response.data.map((item) => ({
      embedding: item.embedding,
      embeddingModel,
    }));
  }

  getEmbeddingModel() {
    return this.getEmbeddingModelName();
  }

  private toResponseInput(input: OpenAIResponseInputItem[]): ResponseInput {
    return input.map((item) => {
      if (item.type === "user_message") {
        return { role: "user", content: item.content };
      }

      return { type: "function_call_output", call_id: item.callId, output: item.output };
    });
  }

  private toFunctionTools(tools: OpenAIResponseTool[]): FunctionTool[] {
    return tools.map((tool) => ({
      type: tool.type,
      name: tool.name,
      description: tool.description,
      strict: tool.strict,
      parameters: tool.parameters,
    }));
  }
}
