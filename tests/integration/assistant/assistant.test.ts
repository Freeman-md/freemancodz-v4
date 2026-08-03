import assert from "node:assert/strict";
import test from "node:test";

import { createChatPostHandler } from "@/app/api/chat/route";
import type { ILogger } from "@/server/infrastructure/logging/logger.interface";
import type { IOpenAIProvider } from "@/server/infrastructure/openai/interfaces/openai.provider.interface";
import type { OpenAIResponseRequest } from "@/server/infrastructure/openai/models/openai-response-request";
import type { ISiteSearchService, MatchSiteChunksRow } from "@/server/modules/search-index/public";
import { AssistantService } from "@/server/modules/assistant/services/assistant.service";
import { MeetingWorkflowService } from "@/server/modules/assistant/workflow/meeting-workflow.service";

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
  response?: (request: OpenAIResponseRequest) => ReturnType<IOpenAIProvider["streamResponse"]>;
} = {}) {
  const inputs: OpenAIResponseRequest[] = [];

  const logger: ILogger = { info: () => undefined, error: () => undefined };

  const openai: IOpenAIProvider = {
    getEmbeddingModel: () => "test-model",
    createEmbedding: embedding,
    createEmbeddings: async () => [],
    streamResponse: async (request) => {
      inputs.push(request);

      return response(request);
    },
  };

  const siteSearch: ISiteSearchService = {
    search: async () => chunks,
  };

  const meetingService = {
    findAvailableSlots: async () => [],
    isSlotAvailable: async () => true,
    bookMeeting: async () => ({ googleEventId: "event_test", googleEventUrl: null }),
    reconcileMeeting: async () => ({ googleEventId: "event_test", googleEventUrl: null }),
  };

  const assistantService = new AssistantService(
    openai,
    siteSearch,
    logger,
    meetingService,
    new MeetingWorkflowService(() => "test-secret"),
  );

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

test("conversational response streams without mandatory retrieval", async () => {
  const { inputs, post } = createAssistant();

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "What assistant did Freeman build?",
        previousResponseId: null,
      }),
    ),
  );

  assert.equal(inputs[0]?.input.length, 1);
  assert.equal(inputs[0]?.previousResponseId, null);
  assert.match(output, /A grounded answer\./);
  assert.match(output, /"sources":\[\]/);
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

test("website tool results are accumulated and supplied to the next response", async () => {
  const { inputs, post } = createAssistant({
    response: async (request) =>
      request.input[0]?.type === "function_call_output"
        ? events(
            { type: "response.created", response: { id: "resp_final" } },
            { type: "response.output_text.delta", delta: "A grounded answer." },
            { type: "response.completed", response: { id: "resp_final" } },
          )
        : events(
            { type: "response.created", response: { id: "resp_tool" } },
            {
              type: "response.output_item.done",
              item: {
                type: "function_call",
                call_id: "call_search",
                name: "search_website",
                arguments: '{"query":"Freeman assistant"}',
              },
            },
            { type: "response.completed", response: { id: "resp_tool" } },
          ),
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "Tell me about Freeman's work.",
        previousResponseId: null,
      }),
    ),
  );

  assert.equal(inputs.length, 2);
  assert.equal(inputs[1]?.input[0]?.type, "function_call_output");
  assert.match(output, /Grounded Assistant/);
  assert.match(output, /A grounded answer\./);
});

test("a search with no results still lets the model respond", async () => {
  const { post } = createAssistant({
    chunks: [],
  });

  const output = await readChatResponse(
    await post(
      chatRequest({
        message: "What is Freeman's favourite planet?",
        previousResponseId: null,
      }),
    ),
  );

  assert.match(output, /A grounded answer\./);
});

test("retrieval failure returns the existing safe stream error", async () => {
  const { post } = createAssistant({
    embedding: async () => {
      throw new Error("embedding unavailable");
    },
    response: async () =>
      events(
        { type: "response.created", response: { id: "resp_tool" } },
        {
          type: "response.output_item.done",
          item: {
            type: "function_call",
            call_id: "call_search",
            name: "search_website",
            arguments: '{"query":"Freeman projects"}',
          },
        },
        { type: "response.completed", response: { id: "resp_tool" } },
      ),
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
