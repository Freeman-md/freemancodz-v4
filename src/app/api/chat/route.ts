import { NextResponse } from "next/server";
import { createOpenAIClient, getResponseModel } from "@/lib/openai";
import { retrieveContext } from "@/lib/rag/retrieve-context";
import { FALLBACK_ANSWER, MAX_MESSAGE_LENGTH } from "./_lib/constants";
import { CHAT_SYSTEM_PROMPT } from "./_lib/prompt";
import type { ChatRequestBody, ChatStreamEvent } from "./_lib/types";
import { encodeStreamEvent, formatContext } from "./_lib/utils";

function createChatStream({
  chunks,
  message,
  request,
  sources,
}: {
  chunks: Awaited<ReturnType<typeof retrieveContext>>["chunks"];
  message: string;
  request: Request;
  sources: Awaited<ReturnType<typeof retrieveContext>>["sources"];
}) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let didStreamText = false;

      function write(event: ChatStreamEvent) {
        controller.enqueue(encoder.encode(encodeStreamEvent(event)));
      }

      try {
        write({ type: "sources", sources });

        if (chunks.length === 0) {
          write({ type: "delta", delta: FALLBACK_ANSWER });
          write({ type: "done" });
          return;
        }

        const openai = createOpenAIClient();
        const responseStream = await openai.responses.create(
          {
            model: getResponseModel(),
            input: [
              {
                role: "system",
                content: [
                  {
                    type: "input_text",
                    text: CHAT_SYSTEM_PROMPT,
                  },
                ],
              },
              {
                role: "user",
                content: [
                  {
                    type: "input_text",
                    text: `Portfolio information:\n\n${formatContext(chunks)}\n\nUser question:\n${message}`,
                  },
                ],
              },
            ],
            stream: true,
          },
          { signal: request.signal },
        );

        for await (const event of responseStream) {
          if (request.signal.aborted) {
            return;
          }

          if (event.type === "response.output_text.delta" && event.delta) {
            didStreamText = true;
            write({ type: "delta", delta: event.delta });
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

        if (!didStreamText) {
          write({ type: "delta", delta: FALLBACK_ANSWER });
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

  const { chunks, sources } = await retrieveContext(message);
  const stream = createChatStream({ chunks, message, request, sources });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
