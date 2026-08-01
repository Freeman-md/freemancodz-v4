import assert from "node:assert/strict";
import test from "node:test";

import { streamChatResponse } from "@/features/assistant/api/stream-assistant-response";

function streamResponse(lines: string[]) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      start(controller) {
        for (const line of lines) {
          controller.enqueue(encoder.encode(line));
        }

        controller.close();
      },
    }),
  );
}

test("assistant client handles a buffered final event and associates stream values", async () => {
  const originalFetch = globalThis.fetch;

  const deltas: string[] = [];

  let responseId = "";

  let sourceTitle = "";

  globalThis.fetch = async () =>
    streamResponse([
      '{"type":"delta","delta":"Hello"}\n',
      '{"type":"sources","sources":[{"id":"1","title":"Work","url":"/work"}]}\n',
      '{"type":"response_id","responseId":"resp_1"}\n{"type":"done"}',
    ]);

  try {
    await streamChatResponse("Hello", null, {
      onDelta: (delta) => deltas.push(delta),
      onResponseId: (id) => {
        responseId = id;
      },
      onSources: (sources) => {
        sourceTitle = sources[0]?.title || "";
      },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(deltas, ["Hello"]);
  assert.equal(sourceTitle, "Work");
  assert.equal(responseId, "resp_1");
});

test("assistant client rejects malformed stream events with a safe error", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => streamResponse(['{"type":"unknown"}\n']);
  try {
    await assert.rejects(
      () =>
        streamChatResponse("Hello", null, {
          onDelta: () => undefined,
          onResponseId: () => undefined,
          onSources: () => undefined,
        }),
      /invalid response/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("assistant client reports non-2xx and provider errors safely", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "Request rejected." }), { status: 429 });
  try {
    await assert.rejects(
      () =>
        streamChatResponse("Hello", null, {
          onDelta: () => undefined,
          onResponseId: () => undefined,
          onSources: () => undefined,
        }),
      /Request rejected/,
    );

    globalThis.fetch = async () =>
      streamResponse(['{"type":"error","error":"The assistant could not respond."}\n']);
    await assert.rejects(
      () =>
        streamChatResponse("Hello", null, {
          onDelta: () => undefined,
          onResponseId: () => undefined,
          onSources: () => undefined,
        }),
      /could not respond/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
