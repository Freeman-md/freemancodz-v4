import "server-only";

import type OpenAI from "openai";
import type {
  IOpenAIProvider,
  GeneratedEmbedding,
  OpenAIResponseRequest,
} from "./interfaces/openai.provider.interface";

export class OpenAIProvider implements IOpenAIProvider {
  constructor(
    private readonly client: OpenAI,
    private readonly embeddingModel: string,
    private readonly responseModel: string,
  ) {}

  streamResponse(request: OpenAIResponseRequest) {
    return this.client.responses.create(
      {
        model: this.responseModel,
        instructions: request.instructions,
        input: request.input,
        tools: request.tools,
        previous_response_id: request.previousResponseId,
        store: true,
        stream: true,
      },
      { signal: request.signal },
    );
  }

  async createEmbedding(input: string) {
    const response = await this.client.embeddings.create({ model: this.embeddingModel, input });

    return response.data[0]?.embedding;
  }

  async createEmbeddings(inputs: string[]): Promise<GeneratedEmbedding[]> {
    if (inputs.length === 0) {
      return [];
    }

    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: inputs,
    });

    if (response.data.length !== inputs.length) {
      throw new Error(`Expected ${inputs.length} embeddings but received ${response.data.length}.`);
    }

    return response.data.map((item) => ({
      embedding: item.embedding,
      embeddingModel: this.embeddingModel,
    }));
  }

  getEmbeddingModel() {
    return this.embeddingModel;
  }
}
