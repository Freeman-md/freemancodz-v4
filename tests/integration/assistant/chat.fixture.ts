import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { TestContext } from "node:test";
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
import type { OpenAIResponseRequest, OpenAITransport } from "@/infrastructure/openai/types";
import { AssistantService } from "@/modules/assistant/service";
import type { PortfolioSearchService } from "@/modules/portfolio/services/portfolio-search.service";
import type { RateLimitResult } from "@/modules/rate-limit/rate-limit.types";

export function createChatFixture(
  streamResponse: OpenAITransport["streamResponse"],
  {
    search = async () => [],
    limit = { allowed: true },
  }: { search?: PortfolioSearchService["search"]; limit?: RateLimitResult } = {},
) {
  const requests: OpenAIResponseRequest[] = [];

  const errors: string[] = [];

  const logger = { info() {}, error: (code: string) => errors.push(code) };

  const openai: OpenAITransport = {
    streamResponse(request) {
      requests.push(request);

      return streamResponse(request);
    },
  };

  const post = createChatPostHandler({
    assistantService: new AssistantService(openai, logger, { search }),
    rateLimitService: { consume: async () => limit },
    logger,
    onVercel: false,
  });

  return { post, requests, errors };
}

export function delta(delta: string) {
  return { type: "response.output_text.delta", delta };
}

export function complete(id: string, output: object[] = []) {
  return { type: "response.completed", response: { id, output } };
}

export function toolCall(name: string, args: object) {
  return { type: "function_call", name, arguments: JSON.stringify(args), call_id: "call_1" };
}

export async function* providerEvents(...events: object[]) {
  yield* events as ResponseStreamEvent[];
}

export const chatRequestOptions = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
};

export function chatRequest(body: string) {
  return new NextRequest("http://localhost/api/chat", { ...chatRequestOptions, body });
}

export function parseEvents(body: string) {
  return body
    .trim()
    .split("\n")
    .map((line) => assistantStreamEventSchema.parse(JSON.parse(line)));
}

export async function readEvents(reader: ReadableStreamDefaultReader<string>) {
  let body = "";

  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    body += chunk.value;
  }

  return parseEvents(body);
}

export async function startChatServer(
  context: TestContext,
  post: ReturnType<typeof createChatPostHandler>,
) {
  const server = createServer((request, response) => {
    const incoming = new NodeNextRequest(request);

    const outgoing = new NodeNextResponse(response);

    const nextRequest = NextRequestAdapter.fromNodeNextRequest(
      incoming,
      signalFromNodeResponse(response),
    );

    void post(nextRequest)
      .then((result) => sendResponse(incoming, outgoing, result))
      .catch((error: Error) => response.destroy(error));
  });

  context.after(() => {
    server.closeAllConnections();
    server.close();
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();

  assert.ok(address && typeof address !== "string");

  return `http://127.0.0.1:${address.port}/api/chat`;
}
