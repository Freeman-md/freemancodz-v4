import { NextResponse } from "next/server";
import { createOpenAIClient, getResponseModel } from "@/lib/openai";
import { retrieveContext } from "@/lib/rag/retrieve-context";

const NO_ANSWER_FALLBACK = "I don’t have enough information to answer that.";

type ChatRequestBody = {
  message?: unknown;
};

function formatContext(
  chunks: Awaited<ReturnType<typeof retrieveContext>>["chunks"],
) {
  return chunks
    .map(
      (chunk, index) =>
        [
          `Source ${index + 1}`,
          `ID: ${chunk.id}`,
          `Title: ${chunk.title}`,
          `Category: ${chunk.category}`,
          `URL: ${chunk.url}`,
          `Keywords: ${chunk.keywords.join(", ")}`,
          `Content: ${chunk.content}`,
        ].join("\n"),
    )
    .join("\n\n");
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

  if (message.length > 500) {
    return NextResponse.json(
      { error: "Message must be 500 characters or fewer." },
      { status: 400 },
    );
  }

  const { chunks, sources } = await retrieveContext(message);

  if (chunks.length === 0) {
    return NextResponse.json({
      answer: NO_ANSWER_FALLBACK,
      sources: [],
    });
  }

  const openai = createOpenAIClient();
  const response = await openai.responses.create({
    model: getResponseModel(),
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: `You are Freeman's portfolio chatbot.

Answer using only the portfolio information you are given.

You may:
- summarize
- compare
- infer cautiously from the available portfolio information
- answer evaluative questions using evidence from the available portfolio information

You must not:
- invent facts
- claim exact numbers, dates, companies, or achievements unless they are present in the portfolio information
- use outside knowledge
- pretend uncertainty is certainty
- mention "context" or "retrieved context" to the visitor

If the available information partially supports an answer, answer the supported part and briefly state what is not specified.

If the available information is empty, irrelevant, or does not support an answer, say:
"I don’t have enough information to answer that."

Keep answers concise, factual, and natural.`,
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
  });

  return NextResponse.json({
    answer: response.output_text || NO_ANSWER_FALLBACK,
    sources,
  });
}
