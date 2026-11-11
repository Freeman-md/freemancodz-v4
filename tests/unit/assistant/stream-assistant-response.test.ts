import assert from "node:assert/strict";
import test from "node:test";
import { streamAssistant } from "@/app/_assistant/api/stream-assistant-response";
import type { AssistantStreamEvent } from "@/contracts/assistant.contract";

function responseFromChunks(...chunks: Uint8Array[]) {
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }

        controller.close();
      },
    }),
  );
}

async function readReply() {
  const events: AssistantStreamEvent[] = [];

  for await (const event of streamAssistant({ message: "Hello", previousResponseId: null })) {
    events.push(event);
  }

  return events;
}

const encoder = new TextEncoder();

test("decodes stream events split across chunks", async (t) => {
  const events = [
    { type: "delta", delta: "Here’s what Freeman built.\n\n" },
    { type: "options", options: ["A web app", "A mobile app"] },
    { type: "sources", sources: [{ id: "jpscents", title: "JPScents", url: "/work/jpscents" }] },
    { type: "response_id", responseId: "resp_finished" },
    { type: "done" },
  ] satisfies AssistantStreamEvent[];

  const bytes = encoder.encode(events.map((event) => JSON.stringify(event)).join("\n") + "\n");

  const split = bytes.indexOf(0xe2) + 1;

  t.mock.method(globalThis, "fetch", async () =>
    responseFromChunks(bytes.slice(0, split), bytes.slice(split, 78), bytes.slice(78)),
  );

  assert.deepEqual(await readReply(), events);
});

test("retries the same message once to establish a browser session", async (t) => {
  const established = responseFromChunks(encoder.encode('{"type":"done"}\n'));

  let attempts = 0;

  const fetch = t.mock.method(globalThis, "fetch", async () => {
    if (++attempts === 1) {
      return new Response(null, { status: 428 });
    }

    return established;
  });

  assert.deepEqual(await readReply(), [{ type: "done" }]);
  assert.equal(fetch.mock.callCount(), 2);
  assert.deepEqual(fetch.mock.calls[0].arguments, fetch.mock.calls[1].arguments);
});

test("reports malformed and interrupted streams safely", async (t) => {
  const cases = [
    {
      name: "invalid JSON",
      line: '{"type":broken}\n',
      message: "The assistant returned an invalid response.",
    },
    {
      name: "invalid event",
      line: '{"type":"options","options":["Only one option"]}\n',
      message: "The assistant returned an invalid response.",
    },
    {
      name: "end of stream before done",
      line: '{"type":"delta","delta":"An unfinished answer."}\n',
      message: "The assistant reply was interrupted. Please try again.",
    },
  ];

  for (const { name, line, message } of cases) {
    await t.test(name, async (t) => {
      t.mock.method(globalThis, "fetch", async () => responseFromChunks(encoder.encode(line)));

      await assert.rejects(readReply, { message });
    });
  }
});
