import assert from "node:assert/strict";
import test from "node:test";

import { streamAssistant } from "@/app/_assistant/api/stream-assistant-response";
import type { AssistantRequest, AssistantStreamEvent } from "@/contracts/assistant.contract";

const workflowInstance = {
  id: "11111111-1111-4111-8111-111111111111",
  workflowId: "meeting-booking",
  workflowVersion: 1,
  revision: 0,
  status: "active",
  progress: {
    phase: "collecting",
    fields: [],
    missingRequiredFields: ["name", "email", "reason", "selectedSlot"],
  },
} as const;

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

async function collectResponse(request: AssistantRequest) {
  const events: AssistantStreamEvent[] = [];

  for await (const event of streamAssistant(request)) {
    events.push(event);
  }

  return events;
}

test("assistant client handles a buffered final event and associates stream values", async () => {
  const originalFetch = globalThis.fetch;

  let requestBody = "";

  globalThis.fetch = async (_input, init) => {
    requestBody = String(init?.body);

    return streamResponse([
      '{"type":"delta","delta":"Hello"}\n',
      '{"type":"sources","sources":[{"id":"1","title":"Work","url":"/work"}]}\n',
      '{"type":"response_id","responseId":"resp_1"}\n',
      `${JSON.stringify({ type: "workflow_instance", instance: workflowInstance })}\n{"type":"done"}`,
    ]);
  };

  let events: AssistantStreamEvent[];

  try {
    events = await collectResponse({
      message: "Hello",
      previousResponseId: null,
      workflowInstanceId: null,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(events, [
    { type: "delta", delta: "Hello" },
    { type: "sources", sources: [{ id: "1", title: "Work", url: "/work" }] },
    { type: "response_id", responseId: "resp_1" },
    {
      type: "workflow_instance",
      instance: workflowInstance,
    },
    { type: "done" },
  ]);
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
        collectResponse({
          message: "Hello",
          previousResponseId: null,
          workflowInstanceId: null,
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
        collectResponse({
          message: "Hello",
          previousResponseId: null,
          workflowInstanceId: null,
        }),
      /Request rejected/,
    );

    globalThis.fetch = async () =>
      streamResponse([
        `${JSON.stringify({ type: "workflow_instance", instance: workflowInstance })}\n`,
        '{"type":"error","error":"The assistant could not respond."}\n',
      ]);
    await assert.rejects(async () => {
      for await (const event of streamAssistant({
        message: "Hello",
        previousResponseId: null,
        workflowInstanceId: null,
      })) {
        if (event.type === "workflow_instance") {
          recoveredWorkflowInstanceId = event.instance.id;
        }
      }
    }, /could not respond/);
    assert.equal(recoveredWorkflowInstanceId, "11111111-1111-4111-8111-111111111111");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
