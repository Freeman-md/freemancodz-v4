import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";
import { NodeNextRequest, NodeNextResponse } from "next/dist/server/base-http/node";
import { sendResponse } from "next/dist/server/send-response";
import {
  NextRequestAdapter,
  signalFromNodeResponse,
} from "next/dist/server/web/spec-extension/adapters/next-request";
import { NextRequest } from "next/server";
import type { ResponseStreamEvent } from "openai/resources/responses/responses";

import { createChatPostHandler } from "@/app/api/chat/route";
import { assistantStreamEventSchema } from "@/contracts/assistant.contract";
import type { Logger } from "@/infrastructure/logging/logger";
import type { OpenAITransport } from "@/infrastructure/openai/types";
import { AssistantService } from "@/modules/assistant/service";

const textDelta = { type: "response.output_text.delta", delta: "Hello." };

const completion = { type: "response.completed", response: { id: "resp_test" } };

async function* providerEvents(...events: object[]) {
  yield* events as ResponseStreamEvent[];
}

function createPost(streamResponse: OpenAITransport["streamResponse"]) {
  const errors: string[] = [];

  const logger: Logger = { info() {}, error: (message) => errors.push(message) };

  const post = createChatPostHandler({
    assistantService: new AssistantService({ streamResponse }, logger),
    rateLimitService: { consume: async () => ({ allowed: true }) },
    logger,
    getAccessSecret: () => "test-only-workflow-access",
    onVercel: false,
  });

  return { post, errors };
}

const messageRequest = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "Hello", previousResponseId: "resp_prior" }),
};

function parseEvents(body: string) {
  return body
    .trimEnd()
    .split("\n")
    .map((line) => assistantStreamEventSchema.parse(JSON.parse(line)));
}

test("streams text before publishing a completed response ID", { timeout: 5000 }, async () => {
  const finish = Promise.withResolvers<void>();

  const { post } = createPost(async ({ previousResponseId }) => {
    assert.equal(previousResponseId, "resp_prior");

    return (async function* () {
      yield* providerEvents(textDelta);
      await finish.promise;
      yield* providerEvents(completion);
    })();
  });

  const response = await post(new NextRequest("http://localhost/api/chat", messageRequest));

  assert.equal(response.status, 200);
  assert.ok(response.body);

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

  try {
    const first = await reader.read();

    assert.ok(!first.done);
    assert.deepEqual(parseEvents(first.value), [{ type: "delta", delta: "Hello." }]);
  } finally {
    finish.resolve();
  }

  let remaining = "";

  for (;;) {
    const chunk = await reader.read();

    if (chunk.done) {
      break;
    }

    remaining += chunk.value;
  }

  assert.deepEqual(parseEvents(remaining), [
    { type: "response_id", responseId: "resp_test" },
    { type: "done" },
  ]);
});

test("reports a provider stream that ends without completion as a failure", async () => {
  const { post, errors } = createPost(async () => providerEvents(textDelta));

  const response = await post(new NextRequest("http://localhost/api/chat", messageRequest));

  assert.deepEqual(parseEvents(await response.text()), [
    { type: "delta", delta: "Hello." },
    { type: "error", error: "The assistant could not respond. Please try again." },
  ]);
  assert.deepEqual(errors, ["assistant.response_failed"]);
});

test(
  "aborting an HTTP fetch after the first chunk cancels the provider",
  { timeout: 5000 },
  async (t) => {
    const providerAborted = Promise.withResolvers<void>();

    const { post, errors } = createPost(async ({ signal }) =>
      (async function* () {
        const aborted = once(signal, "abort", { signal: t.signal });

        yield* providerEvents(textDelta);
        await aborted;
        providerAborted.resolve();
        signal.throwIfAborted();
      })(),
    );

    // Exercise the same request signal and response piping used by Next's Node runtime.
    const server = createServer((request, response) => {
      const nodeRequest = new NodeNextRequest(request);

      const nextRequest = NextRequestAdapter.fromNodeNextRequest(
        nodeRequest,
        signalFromNodeResponse(response),
      );

      void post(nextRequest)
        .then((result) => sendResponse(nodeRequest, new NodeNextResponse(response), result))
        .catch((error: Error) => response.destroy(error));
    });

    t.after(() => {
      server.closeAllConnections();
      server.close();
    });

    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    const address = server.address();

    assert.ok(address && typeof address !== "string");

    const abort = new AbortController();

    const response = await fetch(`http://127.0.0.1:${address.port}/api/chat`, {
      ...messageRequest,
      signal: abort.signal,
    });

    assert.equal(response.status, 200);
    assert.ok(response.body);

    const reader = response.body.getReader();

    const first = await reader.read();

    assert.equal(first.done, false);
    assert.deepEqual(parseEvents(new TextDecoder().decode(first.value)), [
      { type: "delta", delta: "Hello." },
    ]);

    abort.abort();
    await assert.rejects(reader.read(), { name: "AbortError" });
    await providerAborted.promise;
    assert.deepEqual(errors, []);
  },
);
