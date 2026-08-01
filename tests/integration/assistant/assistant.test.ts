import assert from "node:assert/strict";
import test from "node:test";

import { assistantRequestSchema } from "@/contracts/assistant.contract";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type { IOpenAIProvider } from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import type { ISearchIndexService } from "@/server/modules/search-index/interfaces/search-index.service.interface";
import type { MatchSiteChunksRow } from "@/server/modules/search-index/models/search-index";
import { AssistantService } from "@/server/modules/assistant/services/assistant.service";

const source = {
  id: "project-1",
  title: "Grounded Assistant",
  url: "/work",
  content: "Freeman built a portfolio assistant with trusted sources.",
  category: "AI engineering",
  keywords: ["TypeScript", "Next.js"],
  similarity: 0.9,
} satisfies MatchSiteChunksRow;

async function read(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();

  const decoder = new TextDecoder();

  let output = "";

  for (;;) {
    const next = await reader.read();

    if (next.done) {
      return output;
    }

    output += decoder.decode(next.value);
  }
}

function events(...values: Array<Record<string, unknown>>) {
  return (async function* () {
    yield* values;
  })() as never;
}

function createAssistant({
  chunks = [source],
  embedding = async () => [0.1, 0.2],
  response = async () =>
    events(
      { type: "response.created", response: { id: "resp_current" } },
      { type: "response.output_text.delta", delta: "A grounded answer." },
      { type: "response.completed", response: { id: "resp_current" } },
    ),
}: {
  chunks?: MatchSiteChunksRow[];
  embedding?: IOpenAIProvider["createEmbedding"];
  response?: IOpenAIProvider["streamResponse"];
} = {}) {
  const inputs: Array<{ input: string; previousResponseId: string | null }> = [];

  const logger: ILogger = { info: () => undefined, error: () => undefined };

  const openai: IOpenAIProvider = {
    getEmbeddingModel: () => "test-model",
    createEmbedding: embedding,
    createEmbeddings: async () => [],
    streamResponse: async (input, _instructions, previousResponseId, signal) => {
      inputs.push({ input, previousResponseId });

      return response(input, _instructions, previousResponseId, signal);
    },
  };

  const searchIndex: ISearchIndexService = {
    search: async () => chunks,
    indexSource: async () => ({ created: 0, changed: 0, unchanged: 0, deleted: 0 }),
    removeSource: async () => ({ created: 0, changed: 0, unchanged: 0, deleted: 0 }),
    preview: async () => ({ input: {} as never, chunks: [], obsoleteIds: [] }),
    rebuild: async () => ({
      totals: { created: 0, changed: 0, unchanged: 0, deleted: 0 },
      results: [],
    }),
    getJobStatus: async () => ({}) as never,
  };

  return { inputs, service: new AssistantService(openai, searchIndex, logger) };
}

test("direct portfolio question streams its answer, source, and response id", async () => {
  const { inputs, service } = createAssistant();

  const output = await read(
    service.createResponse({
      message: "What assistant did Freeman build?",
      previousResponseId: null,
      signal: new AbortController().signal,
    }),
  );

  assert.match(inputs[0]?.input ?? "", /What assistant did Freeman build\?/);
  assert.equal(inputs[0]?.previousResponseId, null);
  assert.match(output, /A grounded answer\./);
  assert.match(output, /Grounded Assistant/);
  assert.match(output, /resp_current/);
});

test("follow-up question preserves the previous response id and streams the new response", async () => {
  const { inputs, service } = createAssistant();

  const output = await read(
    service.createResponse({
      message: "What technologies did it use?",
      previousResponseId: "resp_previous",
      signal: new AbortController().signal,
    }),
  );

  assert.equal(inputs[0]?.previousResponseId, "resp_previous");
  assert.match(output, /A grounded answer\./);
  assert.match(output, /"type":"done"/);
});

test("multiple relevant sources are returned with one streamed answer", async () => {
  const { service } = createAssistant({
    chunks: [
      source,
      { ...source, id: "experience-1", title: "Platform engineering", url: "/about" },
    ],
  });

  const output = await read(
    service.createResponse({
      message: "Tell me about Freeman's work.",
      previousResponseId: null,
      signal: new AbortController().signal,
    }),
  );

  assert.match(output, /Grounded Assistant/);
  assert.match(output, /Platform engineering/);
  assert.match(output, /A grounded answer\./);
});

test("no relevant sources returns the existing safe fallback without calling the model", async () => {
  let streamed = false;

  const { service } = createAssistant({
    chunks: [],
    response: async () => {
      streamed = true;

      return events();
    },
  });

  const output = await read(
    service.createResponse({
      message: "What is Freeman's favourite planet?",
      previousResponseId: null,
      signal: new AbortController().signal,
    }),
  );

  assert.match(output, /I don.t have enough information/);
  assert.equal(streamed, false);
});

test("retrieval failure returns the existing safe stream error", async () => {
  const { service } = createAssistant({
    embedding: async () => {
      throw new Error("embedding unavailable");
    },
  });

  const output = await read(
    service.createResponse({
      message: "What has Freeman built?",
      previousResponseId: null,
      signal: new AbortController().signal,
    }),
  );

  assert.match(output, /The assistant could not respond\. Please try again\./);
});

test("OpenAI streaming failure returns the existing safe stream error", async () => {
  const { service } = createAssistant({
    response: async () =>
      events({ type: "response.failed", response: { error: { message: "provider unavailable" } } }),
  });

  const output = await read(
    service.createResponse({
      message: "What has Freeman built?",
      previousResponseId: null,
      signal: new AbortController().signal,
    }),
  );

  assert.match(output, /The assistant could not respond\. Please try again\./);
});

test("aborted request stops without emitting a response", async () => {
  const controller = new AbortController();

  controller.abort();
  const { service } = createAssistant();

  const output = await read(
    service.createResponse({
      message: "Stop this request.",
      previousResponseId: null,
      signal: controller.signal,
    }),
  );

  assert.equal(output, "");
});

test("invalid public request is rejected by the public request contract", () => {
  assert.equal(assistantRequestSchema.safeParse({ message: " ".repeat(501) }).success, false);
});

test("rate-limited request receives the current limit response", () => {
  const { service } = createAssistant();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    assert.equal(service.checkRateLimit("integration-client").allowed, true);
  }

  const result = service.checkRateLimit("integration-client");

  assert.equal(result.allowed, false);
  assert.equal(result.error, "Too many messages. Please try again in a few minutes.");
  assert.equal(result.limit, 10);
  assert.equal(result.remaining, 0);
  assert.ok(result.resetAt > Date.now());
});
