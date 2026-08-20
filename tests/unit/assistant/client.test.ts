import assert from "node:assert/strict";
import test from "node:test";

import { streamChatResponse } from "@/features/assistant/api/stream-assistant-response";
import { activeWorkflowInstanceId } from "@/features/assistant/state/active-workflow-instance";

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

  let workflowInstanceId = "";

  let requestBody = "";

  globalThis.fetch = async (_input, init) => {
    requestBody = String(init?.body);

    return streamResponse([
      '{"type":"delta","delta":"Hello"}\n',
      '{"type":"sources","sources":[{"id":"1","title":"Work","url":"/work"}]}\n',
      '{"type":"response_id","responseId":"resp_1"}\n',
      '{"type":"workflow_instance","instance":{"id":"11111111-1111-4111-8111-111111111111","workflowId":"meeting-booking","workflowVersion":1,"status":"active"}}\n{"type":"done"}',
    ]);
  };

  try {
    await streamChatResponse("Hello", null, null, {
      onDelta: (delta) => deltas.push(delta),
      onResponseId: (id) => {
        responseId = id;
      },
      onSources: (sources) => {
        sourceTitle = sources[0]?.title || "";
      },
      onWorkflow: (instance) => {
        workflowInstanceId = instance.id;
      },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(deltas, ["Hello"]);
  assert.equal(sourceTitle, "Work");
  assert.equal(responseId, "resp_1");
  assert.equal(workflowInstanceId, "11111111-1111-4111-8111-111111111111");
  assert.deepEqual(JSON.parse(requestBody), {
    message: "Hello",
    previousResponseId: null,
    workflowInstanceId: null,
  });
});

test("assistant client rejects malformed stream events with a safe error", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => streamResponse(['{"type":"unknown"}\n']);
  try {
    await assert.rejects(
      () =>
        streamChatResponse("Hello", null, null, {
          onDelta: () => undefined,
          onResponseId: () => undefined,
          onSources: () => undefined,
          onWorkflow: () => undefined,
        }),
      /invalid response/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("assistant client reports non-2xx and provider errors safely", async () => {
  const originalFetch = globalThis.fetch;

  let recoveredWorkflowInstanceId = "";

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "Request rejected." }), { status: 429 });
  try {
    await assert.rejects(
      () =>
        streamChatResponse("Hello", null, null, {
          onDelta: () => undefined,
          onResponseId: () => undefined,
          onSources: () => undefined,
          onWorkflow: () => undefined,
        }),
      /Request rejected/,
    );

    globalThis.fetch = async () =>
      streamResponse([
        '{"type":"workflow_instance","instance":{"id":"11111111-1111-4111-8111-111111111111","workflowId":"meeting-booking","workflowVersion":1,"status":"active"}}\n',
        '{"type":"error","error":"The assistant could not respond."}\n',
      ]);
    await assert.rejects(
      () =>
        streamChatResponse("Hello", null, null, {
          onDelta: () => undefined,
          onResponseId: () => undefined,
          onSources: () => undefined,
          onWorkflow: (instance) => {
            recoveredWorkflowInstanceId = instance.id;
          },
        }),
      /could not respond/,
    );
    assert.equal(recoveredWorkflowInstanceId, "11111111-1111-4111-8111-111111111111");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("terminal workflow metadata clears the active browser reference", () => {
  const instance = {
    id: "11111111-1111-4111-8111-111111111111",
    workflowId: "meeting-booking",
    workflowVersion: 1,
  } as const;

  assert.equal(activeWorkflowInstanceId({ ...instance, status: "active" }), instance.id);
  assert.equal(activeWorkflowInstanceId({ ...instance, status: "completed" }), null);
  assert.equal(activeWorkflowInstanceId({ ...instance, status: "cancelled" }), null);
});
