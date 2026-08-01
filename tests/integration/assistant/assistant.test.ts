import assert from "node:assert/strict";
import test from "node:test";

import { createChatPostHandler } from "@/app/api/chat/route";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type { IOpenAIProvider } from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import type { ISiteSearchService, MatchSiteChunksRow } from "@/server/modules/search-index/public";
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

  const siteSearch: ISiteSearchService = {
    search: async () => chunks,
  };

  const assistantService = new AssistantService(openai, siteSearch, logger);

  return { inputs, post: createChatPostHandler({ assistantService }) };
}

function chatRequest(body: unknown, signal?: AbortSignal) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "test-client" },
    body: JSON.stringify(body),
    signal,
  });
}

async function readChatResponse(response: Response) {
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "application/x-ndjson; charset=utf-8");
  assert.ok(response.body);

  return read(response.body);
}

test("direct portfolio question streams its answer, source, and response id", async () => {
  const { inputs, post } = createAssistant();

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "What assistant did Freeman build?",
        previousResponseId: null,
      }),
    ),
  );

  assert.match(inputs[0]?.input ?? "", /What assistant did Freeman build\?/);
  assert.equal(inputs[0]?.previousResponseId, null);
  assert.match(output, /A grounded answer\./);
  assert.match(output, /Grounded Assistant/);
  assert.match(output, /resp_current/);
});

test("follow-up question preserves the previous response id and streams the new response", async () => {
  const { inputs, post } = createAssistant();

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "What technologies did it use?",
        previousResponseId: "resp_previous",
      }),
    ),
  );

  assert.equal(inputs[0]?.previousResponseId, "resp_previous");
  assert.match(output, /A grounded answer\./);
  assert.match(output, /"type":"done"/);
});

test("multiple relevant sources are returned with one streamed answer", async () => {
  const { post } = createAssistant({
    chunks: [
      source,
      { ...source, id: "experience-1", title: "Platform engineering", url: "/about" },
    ],
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "Tell me about Freeman's work.",
        previousResponseId: null,
      }),
    ),
  );

  assert.match(output, /Grounded Assistant/);
  assert.match(output, /Platform engineering/);
  assert.match(output, /A grounded answer\./);
});

test("no relevant sources returns the existing safe fallback without calling the model", async () => {
  let streamed = false;

  const { post } = createAssistant({
    chunks: [],
    response: async () => {
      streamed = true;

      return events();
    },
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "What is Freeman's favourite planet?",
        previousResponseId: null,
      }),
    ),
  );

  assert.match(output, /I don.t have enough information/);
  assert.equal(streamed, false);
});

test("retrieval failure returns the existing safe stream error", async () => {
  const { post } = createAssistant({
    embedding: async () => {
      throw new Error("embedding unavailable");
    },
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "What has Freeman built?",
        previousResponseId: null,
      }),
    ),
  );

  assert.match(output, /The assistant could not respond\. Please try again\./);
});

test("OpenAI streaming failure returns the existing safe stream error", async () => {
  const { post } = createAssistant({
    response: async () =>
      events({ type: "response.failed", response: { error: { message: "provider unavailable" } } }),
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "What has Freeman built?",
        previousResponseId: null,
      }),
    ),
  );

  assert.match(output, /The assistant could not respond\. Please try again\./);
});

test("aborted request stops without emitting a response", async () => {
  const controller = new AbortController();

  controller.abort();
  const { post } = createAssistant();

  const response = await post(
    chatRequest(
      {
        message: "Stop this request.",
        previousResponseId: null,
      },
      controller.signal,
    ),
  );

  const output = await readChatResponse(response);

  assert.equal(output, "");
});

test("invalid public request returns the current safe validation response", async () => {
  const { post } = createAssistant();

  const response = await post(chatRequest({ message: " ".repeat(501) }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Message is required." });
});

test("rate-limited request receives the current limit response", async () => {
  const { post } = createAssistant();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await post(chatRequest({ message: "What has Freeman built?" }));

    assert.equal(response.status, 200);
  }

  const response = await post(chatRequest({ message: "What has Freeman built?" }));

  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), {
    error: "Too many messages. Please try again in a few minutes.",
  });
  assert.equal(response.headers.get("X-RateLimit-Limit"), "10");
  assert.equal(response.headers.get("X-RateLimit-Remaining"), "0");
  assert.ok(Number(response.headers.get("Retry-After")) >= 1);
});
