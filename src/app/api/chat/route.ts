import { NextResponse } from "next/server";
import { createOpenAIClient, getResponseModel } from "@/lib/openai";
import { FALLBACK_ANSWER, MAX_MESSAGE_LENGTH } from "./_lib/constants";
import { CHAT_SYSTEM_PROMPT } from "./_lib/prompt";
import { checkChatRateLimit } from "./_lib/rate-limit";
import type { ChatRequestBody, ChatStreamEvent } from "./_lib/types";
import {
  encodeStreamEvent,
  formatContext,
  normalizePreviousResponseId,
} from "./_lib/utils";
import { retrieveContext } from "../../../features/chat/application/retrieve-context";

function createChatStream({
  chunks,
  message,
  previousResponseId,
  request,
  sources,
}: {
  chunks: Awaited<ReturnType<typeof retrieveContext>>["chunks"];
  message: string;
  previousResponseId: string | null;
  request: Request;
  sources: Awaited<ReturnType<typeof retrieveContext>>["sources"];
}) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let didStreamText = false;
      let responseId: string | null = null;

      function write(event: ChatStreamEvent) {
        controller.enqueue(encoder.encode(encodeStreamEvent(event)));
      }

      try {
        if (chunks.length === 0 && !previousResponseId) {
          write({ type: "delta", delta: FALLBACK_ANSWER });
          write({ type: "done" });
          return;
        }

        const openai = createOpenAIClient();
        const portfolioInformation =
          chunks.length > 0
            ? formatContext(chunks)
            : "No additional portfolio information is available for this message. Use prior conversation only if it contains enough relevant portfolio information.";
        const responseStream = await openai.responses.create(
          {
            model: getResponseModel(),
            instructions: CHAT_SYSTEM_PROMPT,
            input: `Portfolio information:\n\n${portfolioInformation}\n\nCurrent user question:\n${message}`,
            previous_response_id: previousResponseId,
            store: true,
            stream: true,
          },
          { signal: request.signal },
        );

        for await (const event of responseStream) {
          if (request.signal.aborted) {
            return;
          }

          if (event.type === "response.created") {
            responseId = event.response.id;
          }

          if (event.type === "response.output_text.delta" && event.delta) {
            didStreamText = true;
            write({ type: "delta", delta: event.delta });
          }

          if (event.type === "response.completed") {
            responseId = event.response.id;
          }

          if (event.type === "error") {
            throw new Error(event.message);
          }

          if (event.type === "response.failed") {
            throw new Error(
              event.response.error?.message || "OpenAI response failed.",
            );
          }
        }

        write({ type: "sources", sources });

        if (!didStreamText) {
          write({ type: "delta", delta: FALLBACK_ANSWER });
        }

        if (responseId) {
          write({ type: "response_id", responseId });
        }

        write({ type: "done" });
      } catch (error) {
        if (!request.signal.aborted) {
          write({
            type: "error",
            error:
              error instanceof Error
                ? error.message
                : "Failed to process chat request.",
          });
        }
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400 },
    );
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: "Message must be 500 characters or fewer." },
      { status: 400 },
    );
  }

  const rateLimit = checkChatRateLimit(request);

  if (!rateLimit.allowed) {
    const retryAfter = Math.max(
      1,
      Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
    );

    return NextResponse.json(
      { error: rateLimit.error },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
        },
      },
    );
  }

  const previousResponseId = normalizePreviousResponseId(body.previousResponseId);
  const { chunks, sources } = await retrieveContext(message);
  const stream = createChatStream({
    chunks,
    message,
    previousResponseId,
    request,
    sources,
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
