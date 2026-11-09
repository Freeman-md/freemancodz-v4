import "server-only";

import type OpenAI from "openai";

export class OpenAIEmbeddings {
  constructor(private readonly createClient: () => OpenAI) {}

  async embed(inputs: readonly string[], signal?: AbortSignal) {
    const { data } = await this.createClient().embeddings.create(
      {
        model: "text-embedding-3-small",
        input: [...inputs],
        dimensions: 1536,
        encoding_format: "float",
      },
      { signal, timeout: 10_000, maxRetries: 0 },
    );

    const ordered = data.toSorted((left, right) => left.index - right.index);

    if (ordered.some((item, index) => item.index !== index)) {
      throw new Error("The embedding batch contained invalid indexes.");
    }

    return ordered.map(({ embedding }) => embedding);
  }
}
