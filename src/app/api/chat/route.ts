import { NextResponse } from "next/server";
import { createOpenAIClient, getResponseModel } from "@/lib/openai";
import { retrieveContext } from "@/lib/rag/retrieve-context";

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

  try {
    const { chunks, sources } = await retrieveContext(message);

    if (chunks.length === 0) {
      return NextResponse.json({
        answer: "I don't know based on the provided website context.",
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
              text:
                "You answer questions only using the retrieved website context. If the answer is not clearly supported by the retrieved context, reply exactly: I don't know based on the provided website context. Do not invent facts. Keep answers concise and factual.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Retrieved context:\n\n${formatContext(chunks)}\n\nUser question:\n${message}`,
            },
          ],
        },
      ],
    });

    return NextResponse.json({
      answer:
        response.output_text ||
        "I don't know based on the provided website context.",
      sources,
    });
  } catch (error) {
    console.error("RAG chat request failed", error);

    return NextResponse.json(
      { error: "Failed to process chat request." },
      { status: 500 },
    );
  }
}
